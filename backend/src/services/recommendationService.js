const buildRecommendationContext = ({ farmer, crop, questions, answers }) => {
  const questionById = new Map(questions.map((question) => [question._id.toString(), question]));
  const selectedOptions = [];
  const farmingConditions = {};
  const problemIndicators = [];

  answers.forEach(({ questionId, answer }) => {
    const question = questionById.get(questionId.toString());
    if (!question) return;

    const value = Array.isArray(answer) ? answer : [answer];
    const entry = {
      questionId: question._id.toString(),
      category: question.category || 'general',
      question: question.questionText,
      answer
    };

    selectedOptions.push(entry);
    farmingConditions[entry.category] = farmingConditions[entry.category] || [];
    farmingConditions[entry.category].push(...value.map((answerValue) => (
      typeof answerValue === 'boolean' ? (answerValue ? 'Yes' : 'No') : String(answerValue)
    )));

    if (/problem|pest|disease|concern|issue|challenge/i.test(`${question.category || ''} ${question.questionText}`)) {
      problemIndicators.push(entry);
    }
  });

  return {
    farmerId: farmer._id.toString(),
    crop: { id: crop._id.toString(), name: crop.name, season: crop.season || null },
    farmingConditions,
    problemIndicators,
    selectedOptions,
    recommendationFactors: {
      cropId: crop._id.toString(),
      categories: Object.keys(farmingConditions),
      answerCount: answers.length
    }
  };
};

const RECOMMENDATION_WEIGHTS = Object.freeze({
  cropMatch: 12,
  problemTagMatch: 6,
  conditionTagMatch: 4,
  productTagMatch: 3,
  usageMatch: 2,
  categoryMatch: 2,
  maxResults: 12
});

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const GENERIC_TERMS = new Set(['field', 'fields', 'crop', 'crops', 'plant', 'plants', 'product', 'products', 'condition', 'conditions', 'management', 'growth', 'test']);
const normalizeTerm = (term) => term.endsWith('ies') && term.length > 5
  ? `${term.slice(0, -3)}y`
  : term.endsWith('s') && !term.endsWith('ss') && term.length > 4
    ? term.slice(0, -1)
    : term;

const matchesText = (left, right) => {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return true;

  const isRelevantTerm = (term) => term.length >= 4 && !GENERIC_TERMS.has(term);
  const leftTerms = new Set(normalizedLeft.split(/\s+/).filter(isRelevantTerm).map(normalizeTerm));
  return normalizedRight.split(/\s+/).filter(isRelevantTerm).some((term) => leftTerms.has(normalizeTerm(term)));
};

const answerValues = (answer) => (Array.isArray(answer) ? answer : [answer])
  .filter((value) => value !== null && value !== undefined && String(value).trim())
  .map((value) => typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value).trim());

const rankProducts = ({ farmer, crop, questions, answers, products }) => {
  const context = buildRecommendationContext({ farmer, crop, questions, answers });
  const questionSignals = context.selectedOptions.map((entry) => ({
    ...entry,
    values: answerValues(entry.answer),
    isProblem: /problem|pest|disease|issue|concern|challenge/i.test(`${entry.category} ${entry.question}`)
  }));

  const recommendations = products.map((product) => {
    const applicableCropIds = (product.applicableCrops || []).map((item) => (item._id || item).toString());
    const cropMatches = applicableCropIds.includes(crop._id.toString());
    let score = cropMatches ? RECOMMENDATION_WEIGHTS.cropMatch : 0;
    const matchedFactors = [];
    const productTags = [...(product.tags || []), ...(product.recommendationTags || [])];
    const categoryName = product.categoryId?.name || '';
    const usageText = `${product.usage || ''} ${product.description || ''} ${(product.benefits || []).join(' ')}`;

    for (const signal of questionSignals) {
      const matchedValue = signal.values.find((value) =>
        productTags.some((tag) => matchesText(tag, value)) || matchesText(usageText, value) || matchesText(categoryName, value)
      );
      if (!matchedValue) continue;

      const tagMatch = product.recommendationTags?.some((tag) => matchesText(tag, matchedValue));
      const productTagMatch = product.tags?.some((tag) => matchesText(tag, matchedValue));
      const usageMatch = matchesText(usageText, matchedValue);
      const categoryMatch = matchesText(categoryName, matchedValue);
      const conditionWeight = signal.isProblem ? RECOMMENDATION_WEIGHTS.problemTagMatch : RECOMMENDATION_WEIGHTS.conditionTagMatch;
      const matchedBy = [];

      if (tagMatch) {
        score += conditionWeight;
        matchedBy.push('recommendation tags');
      }
      if (productTagMatch) {
        score += RECOMMENDATION_WEIGHTS.productTagMatch;
        matchedBy.push('product tags');
      }
      if (usageMatch) {
        score += RECOMMENDATION_WEIGHTS.usageMatch;
        matchedBy.push('usage');
      }
      if (categoryMatch) {
        score += RECOMMENDATION_WEIGHTS.categoryMatch;
        matchedBy.push('category');
      }
      if (matchedBy.length) {
        matchedFactors.push(`your ${signal.category} answer "${matchedValue}" through ${[...new Set(matchedBy)].join(' and ')}`);
      }
    }

    const reason = cropMatches
      ? matchedFactors.length
        ? `Matches ${crop.name} and ${[...new Set(matchedFactors)].join('; ')}.`
        : `Matches your selected crop, ${crop.name}.`
      : '';

    return {
      ...product,
      id: product._id.toString(),
      recommendationScore: score,
      recommendationReason: reason
    };
  });

  return recommendations
    .filter((product) => product.recommendationScore > 0)
    .sort((left, right) => right.recommendationScore - left.recommendationScore || left.name.localeCompare(right.name))
    .slice(0, RECOMMENDATION_WEIGHTS.maxResults);
};

module.exports = { buildRecommendationContext, rankProducts, RECOMMENDATION_WEIGHTS, matchesText };
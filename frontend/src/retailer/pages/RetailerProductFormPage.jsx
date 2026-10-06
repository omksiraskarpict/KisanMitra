import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

const blankProduct = {
  name: '',
  description: '',
  categoryId: '',
  applicableCrops: [],
  usage: '',
  benefits: [],
  price: '',
  unit: '',
  stock: '',
  brand: '',
  tags: [],
  recommendationTags: [],
  images: [],
  active: true
};

const splitList = (text) =>
  String(text || '')
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);

export default function RetailerProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(blankProduct);

  const [categories, setCategories] = useState([]);
  const [crops, setCrops] = useState([]);

  const [loading, setLoading] = useState(Boolean(id));
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /*
   * ============================================================
   * LOAD CATEGORIES, CROPS AND PRODUCT
   * ============================================================
   */
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoadingOptions(true);
        setError('');

        const requests = [
          api.get('/categories'),
          api.get('/crops')
        ];

        if (id) {
          requests.push(api.get(`/retailer/products/${id}`));
        }

        const responses = await Promise.all(requests);

        if (!active) return;

        /*
         * --------------------------------------------------------
         * Categories
         *
         * Expected backend response:
         * {
         *   categories: [...]
         * }
         *
         * We also support a direct array response.
         * --------------------------------------------------------
         */
        const categoryResponse = responses[0]?.data;

        let loadedCategories = [];

        if (Array.isArray(categoryResponse)) {
          loadedCategories = categoryResponse;
        } else if (Array.isArray(categoryResponse?.categories)) {
          loadedCategories = categoryResponse.categories;
        }

        /*
         * Only keep categories that have a valid MongoDB _id.
         * NO fake/test categories are added here.
         */
        loadedCategories = loadedCategories.filter(
          (category) =>
            category &&
            category._id &&
            category.name
        );

        setCategories(loadedCategories);

        /*
         * --------------------------------------------------------
         * Crops
         * --------------------------------------------------------
         */
        const cropResponse = responses[1]?.data;

        let loadedCrops = [];

        if (Array.isArray(cropResponse)) {
          loadedCrops = cropResponse;
        } else if (Array.isArray(cropResponse?.crops)) {
          loadedCrops = cropResponse.crops;
        }

        loadedCrops = loadedCrops.filter(
          (crop) =>
            crop &&
            crop._id &&
            crop.name
        );

        setCrops(loadedCrops);

        /*
         * --------------------------------------------------------
         * EDIT PRODUCT
         * --------------------------------------------------------
         */
        if (id && responses[2]) {
          const productResponse = responses[2]?.data;
          const product = productResponse?.product || productResponse;

          if (product) {
            setForm({
              ...blankProduct,
              ...product,

              categoryId:
                product.categoryId?._id ||
                product.categoryId ||
                '',

              applicableCrops: Array.isArray(product.applicableCrops)
                ? product.applicableCrops.map(
                    (crop) => crop?._id || crop
                  )
                : [],

              benefits: Array.isArray(product.benefits)
                ? product.benefits
                : splitList(product.benefits),

              tags: Array.isArray(product.tags)
                ? product.tags
                : splitList(product.tags),

              recommendationTags: Array.isArray(
                product.recommendationTags
              )
                ? product.recommendationTags
                : splitList(product.recommendationTags),

              images: Array.isArray(product.images)
                ? product.images
                : splitList(product.images),

              active:
                product.active === undefined
                  ? true
                  : Boolean(product.active)
            });
          }
        }
      } catch (err) {
        if (!active) return;

        console.error(
          'Product form loading error:',
          err
        );

        const status = err.response?.status;
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.error;

        if (status === 401) {
          setError(
            'Your login session has expired. Please login again as a retailer.'
          );
        } else if (backendMessage) {
          setError(backendMessage);
        } else {
          setError(
            'Unable to load categories or crops. Please make sure the backend is running.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setLoadingOptions(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  /*
   * ============================================================
   * HANDLE NORMAL INPUT CHANGES
   * ============================================================
   */
  const change = (event) => {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));

    setError('');
    setSuccess('');
  };

  /*
   * ============================================================
   * TOGGLE SINGLE CROP
   * ============================================================
   */
  const toggleCrop = (cropId) => {
    setForm((previous) => ({
      ...previous,

      applicableCrops:
        previous.applicableCrops.includes(cropId)
          ? previous.applicableCrops.filter(
              (value) => value !== cropId
            )
          : [
              ...previous.applicableCrops,
              cropId
            ]
    }));

    setError('');
    setSuccess('');
  };

  /*
   * ============================================================
   * SELECT ALL CROPS
   * ============================================================
   */
  const selectAllCrops = () => {
    setForm((previous) => ({
      ...previous,
      applicableCrops: crops.map(
        (crop) => crop._id
      )
    }));

    setError('');
    setSuccess('');
  };

  /*
   * ============================================================
   * CLEAR ALL CROPS
   * ============================================================
   */
  const clearAllCrops = () => {
    setForm((previous) => ({
      ...previous,
      applicableCrops: []
    }));

    setError('');
    setSuccess('');
  };

  /*
   * ============================================================
   * VALIDATE FORM
   * ============================================================
   */
  const validateForm = () => {
    if (!form.name.trim()) {
      return 'Product name is required.';
    }

    if (!form.categoryId) {
      return 'Please select a valid product category.';
    }

    /*
     * Make sure selected category really came from MongoDB.
     */
    const validCategory = categories.some(
      (category) =>
        String(category._id) ===
        String(form.categoryId)
    );

    if (!validCategory) {
      return (
        'The selected product category is invalid. ' +
        'Please select a category from the database.'
      );
    }

    if (
      form.price === '' ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      return 'Please enter a valid product price.';
    }

    if (!form.unit.trim()) {
      return 'Product unit is required.';
    }

    if (
      form.stock === '' ||
      Number.isNaN(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      return 'Please enter a valid stock quantity.';
    }

    if (!form.description.trim()) {
      return 'Product description is required.';
    }

    /*
     * Applicable crops are required by the backend/product model.
     */
    if (!form.applicableCrops.length) {
      return 'Please select at least one applicable crop.';
    }

    /*
     * Make sure all crop IDs are real MongoDB crop IDs.
     */
    const validCropIds = new Set(
      crops.map((crop) => String(crop._id))
    );

    const invalidCrop = form.applicableCrops.some(
      (cropId) =>
        !validCropIds.has(String(cropId))
    );

    if (invalidCrop) {
      return (
        'One or more selected crops are invalid. ' +
        'Please select crops from the available list.'
      );
    }

    return '';
  };

  /*
   * ============================================================
   * SAVE PRODUCT
   * ============================================================
   */
  const save = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    /*
     * Create a clean payload.
     *
     * IMPORTANT:
     * categoryId is the REAL MongoDB _id.
     */
    const payload = {
      name: form.name.trim(),

      description: form.description.trim(),

      categoryId: form.categoryId,

      applicableCrops: form.applicableCrops,

      usage: form.usage.trim(),

      benefits: Array.isArray(form.benefits)
        ? form.benefits
        : splitList(form.benefits),

      price: Number(form.price),

      unit: form.unit.trim(),

      stock: Number(form.stock),

      brand: form.brand.trim(),

      tags: Array.isArray(form.tags)
        ? form.tags
        : splitList(form.tags),

      recommendationTags: Array.isArray(
        form.recommendationTags
      )
        ? form.recommendationTags
        : splitList(form.recommendationTags),

      images: Array.isArray(form.images)
        ? form.images
        : splitList(form.images),

      active: Boolean(form.active)
    };

    console.log(
      'Creating/updating product payload:',
      payload
    );

    try {
      let response;

      if (id) {
        response = await api.put(
          `/retailer/products/${id}`,
          payload
        );
      } else {
        response = await api.post(
          '/retailer/products',
          payload
        );
      }

      console.log(
        'Product save response:',
        response.data
      );

      setSuccess(
        id
          ? 'Product updated successfully.'
          : 'Product created successfully.'
      );

      /*
       * Give the user a moment to see the success message,
       * then return to retailer products.
       */
      setTimeout(() => {
        navigate('/retailer/products');
      }, 700);
    } catch (err) {
      console.error(
        'Product save error:',
        err
      );

      const status = err.response?.status;

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.details;

      if (status === 400) {
        setError(
          backendMessage ||
          'Invalid product data. Please check the category, crops and other fields.'
        );
      } else if (status === 401) {
        setError(
          'Your retailer login session is expired or invalid. Please login again.'
        );
      } else if (status === 403) {
        setError(
          'You are not authorized to create products. Please login with a retailer account.'
        );
      } else if (status === 404) {
        setError(
          'Product API endpoint was not found. Please check the backend server.'
        );
      } else {
        setError(
          backendMessage ||
          'Unable to save product. Please check the backend console.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * LOADING SCREEN
   * ============================================================
   */
  if (loading) {
    return (
      <div className="page-shell loader">
        Loading product...
      </div>
    );
  }

  /*
   * ============================================================
   * CATEGORY STATUS
   * ============================================================
   */
  const noCategories =
    !loadingOptions &&
    categories.length === 0;

  const noCrops =
    !loadingOptions &&
    crops.length === 0;

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */
  return (
    <main className="page-shell">

      {/* ======================================================
          HEADER
      ====================================================== */}
      <section className="section-header">

        <div>
          <span className="eyebrow">
            Retailer inventory
          </span>

          <h2>
            {id
              ? 'Edit product'
              : 'Add product'}
          </h2>
        </div>

        <Link
          className="btn btn-secondary"
          to="/retailer/products"
        >
          Back to products
        </Link>

      </section>

      {/* ======================================================
          FORM
      ====================================================== */}
      <form
        className="panel auth-form retailer-form"
        onSubmit={save}
      >

        {/* ====================================================
            BASIC PRODUCT INFORMATION
        ==================================================== */}
        <div className="info-grid">

          {/* PRODUCT NAME */}
          <label>
            Product name

            <input
              name="name"
              value={form.name}
              onChange={change}
              required
              placeholder="e.g. NeemGuard Organic Pesticide"
            />
          </label>

          {/* CATEGORY */}
          <label>
            Category

            <select
              name="categoryId"
              value={form.categoryId}
              onChange={change}
              required
              disabled={
                loadingOptions ||
                noCategories
              }
            >

              <option value="">
                {loadingOptions
                  ? 'Loading categories...'
                  : noCategories
                    ? 'No categories available'
                    : 'Select category'}
              </option>

              {categories.map(
                (category) => (
                  <option
                    value={category._id}
                    key={category._id}
                  >
                    {category.name}
                  </option>
                )
              )}

            </select>

            {noCategories && (
              <small className="field-error">
                No categories were returned by
                the server. Run the category/product
                seed script and refresh this page.
              </small>
            )}
          </label>

          {/* PRICE */}
          <label>
            Price

            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.price}
              onChange={change}
              required
              placeholder="499"
            />
          </label>

          {/* UNIT */}
          <label>
            Unit

            <input
              name="unit"
              value={form.unit}
              onChange={change}
              required
              placeholder="Bag, bottle, pack, litre"
            />
          </label>

          {/* STOCK */}
          <label>
            Stock

            <input
              type="number"
              name="stock"
              min="0"
              step="1"
              value={form.stock}
              onChange={change}
              required
              placeholder="100"
            />
          </label>

          {/* BRAND */}
          <label>
            Brand

            <input
              name="brand"
              value={form.brand}
              onChange={change}
              placeholder="KisanMitra Agro"
            />
          </label>

        </div>

        {/* ====================================================
            DESCRIPTION
        ==================================================== */}
        <label>
          Description

          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={change}
            required
            placeholder="Enter a clear description of the product..."
          />
        </label>

        {/* ====================================================
            APPLICABLE CROPS
        ==================================================== */}
        <div className="retailer-crops-header">

          <label>
            Applicable crops
          </label>

          {crops.length > 0 && (
            <div
              className="crop-selection-actions"
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={selectAllCrops}
              >
                Select all
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearAllCrops}
              >
                Clear all
              </button>
            </div>
          )}

        </div>

        {loadingOptions ? (
          <div className="panel">
            Loading crops...
          </div>
        ) : noCrops ? (
          <div className="panel">
            No crops are currently available.
            Please seed the crops database.
          </div>
        ) : (
          <div className="retailer-crop-options">

            {crops.map((crop) => (
              <label
                className="question-choice"
                key={crop._id}
              >

                <input
                  type="checkbox"
                  checked={form.applicableCrops.includes(
                    crop._id
                  )}
                  onChange={() =>
                    toggleCrop(crop._id)
                  }
                />

                <span>
                  {crop.name}
                </span>

              </label>
            ))}

          </div>
        )}

        {/* ====================================================
            USAGE
        ==================================================== */}
        <label>
          Usage

          <textarea
            name="usage"
            rows={2}
            value={form.usage}
            onChange={change}
            placeholder="Explain how the product is used..."
          />
        </label>

        {/* ====================================================
            BENEFITS
        ==================================================== */}
        <label>
          Benefits (comma separated)

          <input
            value={form.benefits.join(', ')}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                benefits: splitList(
                  event.target.value
                )
              }))
            }
            placeholder="Controls pests, Organic formula, Easy to use"
          />
        </label>

        {/* ====================================================
            TAGS
        ==================================================== */}
        <label>
          Tags (comma separated)

          <input
            value={form.tags.join(', ')}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                tags: splitList(
                  event.target.value
                )
              }))
            }
            placeholder="organic, pesticide, neem, crop protection"
          />
        </label>

        {/* ====================================================
            RECOMMENDATION TAGS
        ==================================================== */}
        <label>
          Recommendation tags (comma separated)

          <input
            value={form.recommendationTags.join(', ')}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                recommendationTags: splitList(
                  event.target.value
                )
              }))
            }
            placeholder="pest control, neem pesticide, organic farming"
          />
        </label>

        {/* ====================================================
            IMAGE URLS
        ==================================================== */}
        <label>
          Image URLs (comma separated)

          <textarea
            rows={2}
            value={form.images.join(', ')}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                images: splitList(
                  event.target.value
                )
              }))
            }
            placeholder="https://example.com/product-image.jpg"
          />

          <small>
            You can enter multiple image URLs
            separated by commas.
          </small>
        </label>

        {/* ====================================================
            ACTIVE PRODUCT
        ==================================================== */}
        {id && (
          <label className="retailer-active-toggle">

            <input
              type="checkbox"
              name="active"
              checked={Boolean(form.active)}
              onChange={change}
            />

            Active product

          </label>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}
        {error && (
          <div
            className="feedback error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* ====================================================
            SUCCESS
        ==================================================== */}
        {success && (
          <div
            className="feedback success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* ====================================================
            ACTION BUTTONS
        ==================================================== */}
        <div className="auth-actions">

          <button
            className="btn btn-primary"
            type="submit"
            disabled={
              saving ||
              loadingOptions ||
              categories.length === 0 ||
              crops.length === 0
            }
          >
            {saving
              ? 'Saving...'
              : id
                ? 'Save changes'
                : 'Create product'}
          </button>

          <Link
            className="btn btn-secondary"
            to="/retailer/products"
          >
            Cancel
          </Link>

        </div>

      </form>
    </main>
  );
}
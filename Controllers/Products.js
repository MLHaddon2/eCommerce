import Product from '../models/productModel.js';
import { handleError } from '../utils/handleError.js';
import { randomUUID } from 'node:crypto';


export const getMostRecentProducts = async (req, res) => {
  try {
    const lastID = await Product.max('id');
    const product = await Product.findOne({ where: { id: lastID } });
    if (!product) return res.status(404).json({ message: 'No product found' });
    return res.status(200).json(product);
  } catch (error) {
    return handleError(res, 'Get most recent product', error);
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {id: req.params.id}
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    };
    // Parse reviews if it comes back as a string
    product.reviews = typeof product.reviews === 'string' 
      ? JSON.parse(product.reviews) 
      : product.reviews;
    product.category = typeof product.category === 'string'
      ? JSON.parse(product.category)
      : product.category;
    product.price = Number(product.price);
    res.status(200).json({message: "Product found successfully: ", product});
  } catch (error) {
    console.error('Error in getProduct:', error);
    res.status(500).json({ message: "Internal server error" });
  };
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    };
    for await (const product of products) { 
      // Parse reviews if it comes back as a string
      product.reviews = typeof product.reviews === 'string' 
        ? JSON.parse(product.reviews) 
        : product.reviews;
      product.category = typeof product.category === 'string'
        ? JSON.parse(product.category)
        : product.category;
      product.price = Number(product.price);
     }
    res.status(200).json(products);
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ message: "Internal server error" });
    // Error check for more than ONE json
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, summary, description, reviews, availability, price, category, product_img, isDonation } = req.body;

    const isDefined = (val) => val !== undefined && val !== null;

    if (!name || !summary || !description || !reviews || !isDefined(availability) || !isDefined(price) || !category) {
      return res.status(400).json({ message: "All fields are required" });
    };
    const product = await Product.create({
      name,
      summary,
      description,
      reviews,
      availability,
      price,
      category,
      product_img: product_img || "",
      isDonation: Boolean(isDonation)
    });
    res.status(200).json({message: "Product created successfully: ", product});
  } catch (error) {
    console.error('Error in createProducts:', error);
    res.status(500).json({ message: "Internal server error", error });
  };
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {id: req.params.id}
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    };
    await product.destroy();
    res.status(200).json({message: "Product deleted successfully"});
  } catch (error) {
    console.error('Error in deleteProducts:', error);
    res.status(500).json({ message: "Internal server error" });
  };
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Only update fields that are actually provided
    const updatableFields = [
      "name",
      "summary",
      "description",
      "reviews",
      "availability",
      "price",
      "category",
      "product_img",
      "isDonation"
    ];

    const updates = {};

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If nothing was provided, reject the request
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    await product.update(updates);
    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Reviews ───────────────────────────────────────────────────────────────────
// Reviews live in the products.reviews JSON column as
// { id, userId, username, rating, comment, date, editedAt? }.

const parseJsonField = (value, fallback) => {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

const reviewsOf = (product) => parseJsonField(product.reviews, []);

// Product as the client expects it (JSON columns parsed, price as a number).
const serializeProduct = (product) => {
  const json = product.toJSON();
  return {
    ...json,
    reviews: parseJsonField(json.reviews, []),
    category: parseJsonField(json.category, []),
    price: Number(json.price)
  };
};

const validateReview = (body) => {
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Rating must be a whole number from 1 to 5" };
  if (comment.length > 1000) return { error: "Review must be 1000 characters or fewer" };
  return { rating, comment };
};

// POST /api/products/:id/reviews — any logged-in user. The author comes from the
// verified token, not the request body.
export const addReview = async (req, res) => {
  try {
    const { rating, comment, error } = validateReview(req.body);
    if (error) return res.status(400).json({ message: error });

    const product = await Product.findOne({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = {
      id: randomUUID(),
      userId: req.userID,
      username: req.username,
      rating,
      comment,
      date: new Date().toISOString()
    };

    await product.update({ reviews: [...reviewsOf(product), review] });
    res.status(201).json({ message: "Review added", review, product: serializeProduct(product) });
  } catch (error) {
    return handleError(res, 'Add review', error);
  }
};

// Loads the product and finds the review; sends the error response itself if either is missing.
const findReview = async (req, res) => {
  const product = await Product.findOne({ where: { id: req.params.id } });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return null;
  }
  const reviews = reviewsOf(product);
  const index = reviews.findIndex((r) => String(r.id) === String(req.params.reviewId));
  if (index === -1) {
    res.status(404).json({ message: "Review not found" });
    return null;
  }
  return { product, reviews, index, review: reviews[index] };
};

const isAuthor = (req, review) => review.userId !== undefined && String(review.userId) === String(req.userID);

// PUT /api/products/:id/reviews/:reviewId — only the review's author.
export const updateReview = async (req, res) => {
  try {
    const { rating, comment, error } = validateReview(req.body);
    if (error) return res.status(400).json({ message: error });

    const found = await findReview(req, res);
    if (!found) return;
    if (!isAuthor(req, found.review)) {
      return res.status(403).json({ message: "You can only edit your own reviews" });
    }

    const reviews = found.reviews.map((r, i) =>
      i === found.index ? { ...r, rating, comment, editedAt: new Date().toISOString() } : r
    );
    await found.product.update({ reviews });
    res.status(200).json(serializeProduct(found.product));
  } catch (error) {
    return handleError(res, 'Update review', error);
  }
};

// DELETE /api/products/:id/reviews/:reviewId — the author, or an admin (moderation).
export const deleteReview = async (req, res) => {
  try {
    const found = await findReview(req, res);
    if (!found) return;
    if (!isAuthor(req, found.review) && !req.isAdmin) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    await found.product.update({ reviews: found.reviews.filter((_, i) => i !== found.index) });
    res.status(200).json(serializeProduct(found.product));
  } catch (error) {
    return handleError(res, 'Delete review', error);
  }
};

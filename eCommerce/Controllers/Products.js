import Product from '../models/productModel.js';

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error)
  });
};

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
    const { name, summary, description, reviews, availability, price, category, product_img } = req.body;

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
      product_img: product_img || ""
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
    console.log("BODY RECEIVED:", req.body);

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
      "product_img"
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

    await Product.update(updates, {
      where: { id: req.params.id }
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import Product from '../models/productModel.js';

export const getMostRecentProducts = async (req, res) => {
  try {
    const lastID = await Products.max('id');
    const products = await Products.findOne({
      where: {id: lastID}
    });
    res.json(products);
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ message: "Internal server error" });
    // Error check for more than ONE json
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
    if (!name || !summary || !description || !reviews || !availability || !price || !category || !product_img) {
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
      product_img
    });
    res.status(200).json({message: "Product created successfully: ", product});
  } catch (error) {
    console.error('Error in createProducts:', error);
    res.status(500).json({ message: "Internal server error" });
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
      where: {id: req.params.id}
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    };
    const { name, summary, description, reviews, availability, price, category, product_img } = req.body;
    if (!name || !summary || !description || !reviews || !availability || !price || !category || !product_img) {
      return res.status(400).json({ message: "All fields are required" });
    };
    await Product.update({
      name,
      summary,
      description,
      reviews,
      availability,
      price,
      category,
      product_img
    }, {
      where: {id: req.params.id}
    });
    res.status(200).json({message: "Product updated successfully", product});
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
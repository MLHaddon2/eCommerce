import React, { useState, useEffect } from 'react';
import { Container, Row, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext.js';
import ProductCard from '../../components/ProductCard';

// FIXED:
// - Replaced the locally-defined ProductCard (which was re-created on every render
//   because it was declared inside the parent component) with the shared
//   <ProductCard> component from components/ProductCard.js
// - This also removes the near-identical duplicate that existed in Home.js

const BrowseProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, getProducts, loading } = useData();

  useEffect(() => {
    if (products.length === 0) {
      getProducts().catch((error) => console.error('Error loading products in Browse:', error));
    }
  }, [products.length, getProducts]);

  const categories = {
    Gender: {
      "Men's": products.filter((p) => p.category.includes("Men's")),
      "Women's": products.filter((p) => p.category.includes("Women's")),
      Unisex: products.filter((p) => p.category.includes('Unisex')),
    },
    'Shoe Type': {
      Boots: products.filter((p) => p.category.includes('Boots')),
      Sneakers: products.filter((p) => p.category.includes('Sneakers')),
      Sandals: products.filter((p) => p.category.includes('Sandals')),
      Loafers: products.filter((p) => p.category.includes('Loafers')),
      Clogs: products.filter((p) => p.category.includes('Clogs')),
      'Boat Shoes': products.filter((p) => p.category.includes('Boat Shoes')),
      'Water Shoes': products.filter((p) => p.category.includes('Water Shoes')),
      'Flip Flops': products.filter((p) => p.category.includes('Flip Flops')),
    },
    Style: {
      Casual: products.filter((p) => p.category.includes('Casual')),
      Formal: products.filter((p) => p.category.includes('Formal')),
      Sport: products.filter((p) => p.category.includes('Sport')),
      Outdoor: products.filter((p) => p.category.includes('Outdoor')),
    },
  };

  const filterBySearch = (prods) => {
    if (!searchTerm) return prods;
    const lower = searchTerm.toLowerCase();
    return prods.filter(
      (product) =>
        product.name.toLowerCase().includes(lower) ||
        product.description.toLowerCase().includes(lower)
    );
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Browse Products</h2>

      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading.products ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <div className="mt-3">Loading products...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5">
          <h4>No products available yet.</h4>
          <p className="text-muted">Please check back later or refresh the page.</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="Shoe Type" className="mb-4">
          {Object.entries(categories).map(([mainCategory, subcategories]) => (
            <Tab key={mainCategory} eventKey={mainCategory} title={mainCategory}>
              <div className="mt-4">
                {Object.entries(subcategories).map(([subcategory, subcategoryProducts]) => {
                  const filteredProducts = filterBySearch(subcategoryProducts);
                  if (filteredProducts.length === 0) return null;

                  return (
                    <div key={subcategory} className="mb-5">
                      <h3 className="mb-4">
                        {subcategory}
                        <span className="text-muted fs-5 ms-2">
                          ({filteredProducts.length} products)
                        </span>
                      </h3>
                      <Row>
                        {filteredProducts.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </Row>
                    </div>
                  );
                })}
              </div>
            </Tab>
          ))}
        </Tabs>
      )}
    </Container>
  );
};

export default BrowseProducts;

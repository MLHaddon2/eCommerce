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

  // Categories come from the product data (free-form tags), so new tags show up
  // without code changes. Stray whitespace in tags is ignored.
  const categoriesOf = (product) => [
    ...new Set(
      (Array.isArray(product.category) ? product.category : [])
        .map((tag) => String(tag).trim())
        .filter(Boolean)
    ),
  ];

  const byCategory = {};
  products.forEach((product) => {
    categoriesOf(product).forEach((tag) => {
      (byCategory[tag] = byCategory[tag] || []).push(product);
    });
  });
  // Largest categories first, then alphabetical.
  const categoryEntries = Object.entries(byCategory).sort(
    ([a, aProducts], [b, bProducts]) => bProducts.length - aProducts.length || a.localeCompare(b)
  );

  const donations = products.filter((p) => p.isDonation);

  const filterBySearch = (prods) => {
    if (!searchTerm) return prods;
    const lower = searchTerm.toLowerCase();
    return prods.filter(
      (product) =>
        product.name?.toLowerCase().includes(lower) ||
        product.description?.toLowerCase().includes(lower) ||
        categoriesOf(product).some((tag) => tag.toLowerCase().includes(lower))
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
        <Tabs defaultActiveKey="All Items" className="mb-4">
          <Tab eventKey="All Items" title="All Items">
            <div className="mt-4">
              <Row>
                {filterBySearch(products).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </Row>
            </div>
          </Tab>
          <Tab eventKey="Categories" title="Categories">
            <div className="mt-4">
              {categoryEntries.map(([category, categoryProducts]) => {
                const filteredProducts = filterBySearch(categoryProducts);
                if (filteredProducts.length === 0) return null;

                return (
                  <div key={category} className="mb-5">
                    <h3 className="mb-4">
                      {category}
                      <span className="text-muted fs-5 ms-2">
                        ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
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
          {donations.length > 0 && (
            <Tab eventKey="Donations" title="Donations">
              <div className="mt-4">
                <p className="text-muted">Donations are tax-free and don't need a shipping address.</p>
                <Row>
                  {filterBySearch(donations).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </Row>
              </div>
            </Tab>
          )}
        </Tabs>
      )}
    </Container>
  );
};

export default BrowseProducts;

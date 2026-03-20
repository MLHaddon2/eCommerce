import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext.js';
import { useCart } from '../../contexts/CartContext.js';

const BrowseProducts = () => {
  const [ searchTerm, setSearchTerm ] = useState('');
  const { products } = useData();

  // Category organization
  const categories = {
    'Gender': {
      "Men's": products.filter(p => p.category.includes("Men's")),
      "Women's": products.filter(p => p.category.includes("Women's")),
      "Unisex": products.filter(p => p.category.includes("Unisex")),
    },
    'Shoe Type': {
      "Boots": products.filter(p => p.category.includes("Boots")),
      "Sneakers": products.filter(p => p.category.includes("Sneakers")),
      "Sandals": products.filter(p => p.category.includes("Sandals")),
      "Loafers": products.filter(p => p.category.includes("Loafers")),
      "Clogs": products.filter(p => p.category.includes("Clogs")),
      "Boat Shoes": products.filter(p => p.category.includes("Boat Shoes")),
      "Water Shoes": products.filter(p => p.category.includes("Water Shoes")),
      "Flip Flops": products.filter(p => p.category.includes("Flip Flops")),
    },
    'Style': {
      "Casual": products.filter(p => p.category.includes("Casual")),
      "Formal": products.filter(p => p.category.includes("Formal")),
      "Sport": products.filter(p => p.category.includes("Sport")),
      "Outdoor": products.filter(p => p.category.includes("Outdoor")),
    }
  };

  // Filter products by search term
  const filterBySearch = (products) => {
    if (!searchTerm) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Browse.js (only the modified ProductCard component)
  const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    
    return (
      <Col md={4} className="mb-4">
        <Card className="h-100">
          <Card.Img 
            variant="top" 
            src={product.product_img || "https://i.ibb.co/123pvjr/300x200.png"} 
            alt={"https://i.ibb.co/123pvjr/300x200.png"} 
            style={{ height: '200px', objectFit: 'contain' }}
          />
          <Card.Body className="d-flex flex-column">
            <Card.Title>{product.name}</Card.Title>
            <Card.Text className="text-muted">
              {product.summary}
            </Card.Text>
            <div className="mt-auto">
              <p className="h5 mb-3">${product.price}</p>
              <div className="d-flex gap-2">
                <Link 
                  to={`/product/${product.id}`} 
                  className="text-decoration-none"
                >
                  <Button variant="primary">View Details</Button>
                </Link>
                <Button 
                  variant="success"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Browse Products</h2>
      
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
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
                      {filteredProducts.map(product => (
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
    </Container>
  );
};

export default BrowseProducts;
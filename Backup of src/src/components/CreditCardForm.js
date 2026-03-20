import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  Row, 
  Col, 
  InputGroup, 
  Alert,
  Badge,
  Container
} from 'react-bootstrap';
import { CreditCard, Lock } from 'lucide-react';

const CreditCardForm = ({ 
  onSubmit, 
  loading = false, 
  disabled = false, 
  amount = 0, 
  showSaveOption = false,
  buttonText = 'Complete Payment'
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState({});
  const [cardType, setCardType] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [validated, setValidated] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Detect card type
  const detectCardType = (number) => {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(number)) {
        return type;
      }
    }
    return '';
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Card number validation
    const cardNum = formData.cardNumber.replace(/\s/g, '');
    if (!cardNum) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNum.length < 13 || cardNum.length > 19) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Invalid month';
      } else if (parseInt(year) < currentYear || 
                (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'Invalid CVV';
    }

    // Cardholder name validation
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    // ZIP code validation
    if (!formData.zipCode) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      if (formattedValue.length <= 19) {
        const cleanNumber = formattedValue.replace(/\s/g, '');
        setCardType(detectCardType(cleanNumber));
      }
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.length > 5) return;
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return;
    } else if (name === 'zipCode') {
      formattedValue = value.replace(/[^0-9-]/g, '');
      if (formattedValue.length > 10) return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidated(true);
    
    if (validateForm()) {
      onSubmit(formData, saveCard);
    }
  };

  const getCardIcon = () => {
    switch (cardType) {
      case 'visa':
        return <Badge bg="primary" className="px-2 py-1">VISA</Badge>;
      case 'mastercard':
        return <Badge bg="danger" className="px-2 py-1">MC</Badge>;
      case 'amex':
        return <Badge bg="success" className="px-2 py-1">AMEX</Badge>;
      case 'discover':
        return <Badge bg="warning" className="px-2 py-1">DISC</Badge>;
      default:
        return <CreditCard className="text-muted" size={20} />;
    }
  };

  return (
    <Container className="d-flex justify-content-center">
      <Card className="shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body className="p-4">
          {/* Header */}
          <div className="text-center mb-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #007bff, #6f42c1)'
              }}
            >
              <CreditCard className="text-white" size={32} />
            </div>
            <Card.Title as="h2" className="mb-2">Payment Details</Card.Title>
            <Card.Text className="text-muted">
              Enter your card information securely
            </Card.Text>
          </div>

          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            {/* Card Number */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Card Number</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  isInvalid={!!errors.cardNumber}
                  required
                />
                <InputGroup.Text className="bg-white border-start-0">
                  {getCardIcon()}
                </InputGroup.Text>
                <Form.Control.Feedback type="invalid">
                  {errors.cardNumber}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>

            {/* Expiry and CVV */}
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label className="fw-semibold">Expiry Date</Form.Label>
                  <Form.Control
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    isInvalid={!!errors.expiryDate}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.expiryDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="fw-semibold">CVV</Form.Label>
                  <Form.Control
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    isInvalid={!!errors.cvv}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.cvv}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Cardholder Name */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Cardholder Name</Form.Label>
              <Form.Control
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                isInvalid={!!errors.cardholderName}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.cardholderName}
              </Form.Control.Feedback>
            </Form.Group>

            {/* ZIP Code */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">ZIP Code</Form.Label>
              <Form.Control
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="12345"
                isInvalid={!!errors.zipCode}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.zipCode}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Save Card Option */}
            {showSaveOption && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="save-card"
                  label="Save this card for future purchases"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="fw-normal"
                />
              </Form.Group>
            )}

            {/* Security Notice */}
            <Alert variant="light" className="d-flex align-items-center mb-3">
              <Lock size={16} className="me-2 text-muted" />
              <small className="text-muted mb-0">
                Your payment information is secure and encrypted
              </small>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-100 fw-semibold shadow"
              disabled={loading || disabled}
              style={{
                background: loading || disabled 
                  ? undefined 
                  : 'linear-gradient(135deg, #007bff, #6f42c1)',
                border: 'none'
              }}
            >
              {loading 
                ? 'Processing...' 
                : amount > 0 
                  ? `${buttonText} $${amount.toFixed(2)}` 
                  : buttonText
              }
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreditCardForm;
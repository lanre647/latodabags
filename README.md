# Handmade Bags E-commerce Platform (Nigeria)

A secure MERN stack e-commerce platform for on-demand handmade bags with Paystack payment integration for Nigeria.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Payment Integration**: Paystack for Nigerian payments (NGN)
- **Security Headers**: Helmet.js for enhanced security
- **CORS Protection**: Strict origin control
- **MongoDB Atlas**: Cloud database with connection pooling
- **Environment Validation**: Joi schema validation
- **Request Logging**: Morgan HTTP logger
- **XSS Protection**: XSS-clean middleware
- **NoSQL Injection Prevention**: Express-mongo-sanitize
- **Image Upload**: Cloudinary integration

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account
- Paystack account (Nigerian payment gateway)
- Cloudinary account (for image uploads)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd handmade-bags-ecommerce
```

### 2. Server Setup

```bash
cd server
npm install
```

Create `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/handmade_bags?retryWrites=true&w=majority
JWT_SECRET=your_32_character_secret_key_here
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Client Setup

```bash
cd ../client
npx create-react-app .
npm install react-router-dom axios react-query react-toastify formik yup react-paystack react-icons date-fns
```

Create `.env` file in the client directory:

```bash
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
```

## 🔑 Getting API Keys

### MongoDB Atlas
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string with `retryWrites=true` parameter

### Paystack (Nigeria)
1. Visit [Paystack Dashboard](https://dashboard.paystack.com)
2. Sign up/Login
3. Navigate to Settings > API Keys & Webhooks
4. Copy your test keys (use live keys for production)

### Cloudinary
1. Visit [Cloudinary](https://cloudinary.com)
2. Sign up for free account
3. Get credentials from Dashboard

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

### Production Mode

**Server:**
```bash
cd server
npm start
```

**Client:**
```bash
cd client
npm run build
# Serve build folder with your preferred static server
```

## 🔍 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Bags (Coming)
- `GET /api/v1/bags` - Get all bags
- `GET /api/v1/bags/:id` - Get single bag
- `POST /api/v1/bags` - Create bag (Admin)
- `PUT /api/v1/bags/:id` - Update bag (Admin)
- `DELETE /api/v1/bags/:id` - Delete bag (Admin)

### Orders (Coming)
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get single order
- `POST /api/v1/orders` - Create order
- `PUT /api/v1/orders/:id` - Update order status (Admin)

### Payments (Coming)
- `POST /api/v1/payments/initialize` - Initialize Paystack payment
- `GET /api/v1/payments/verify/:reference` - Verify payment
- `POST /api/v1/payments/webhook` - Paystack webhook

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Strict origin validation
- **Rate Limiting**: 100 req/15min general, 5 req/15min auth, 10 req/15min payment
- **XSS Protection**: XSS-clean middleware
- **NoSQL Injection**: Express-mongo-sanitize
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Environment Validation**: Joi schema validation

## 📊 MongoDB Connection Options

```javascript
{
  retryWrites: true,       // Retry failed writes
  w: 'majority',          // Write concern
  maxPoolSize: 5,         // Max connections in pool
  minPoolSize: 2,         // Min connections in pool
  socketTimeoutMS: 45000, // Socket timeout
  serverSelectionTimeoutMS: 5000 // Server selection timeout
}
```

## 🧪 Testing

```bash
cd server
npm test
```

## 📝 Environment Variables

See `.env.example` files in both `server` and `client` directories for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 🆘 Support

For issues and questions, please open an issue in the repository.

---

**Made with ❤️ for Nigerian Artisans**

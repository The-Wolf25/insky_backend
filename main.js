const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  },
});

const upload = multer({ storage });

// MongoDB connection using Mongoose
const uri = "mongodb+srv://theprajj25:25112511@cluster0.qp12wan.mongodb.net/your-database-name?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, { })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Define product schema and model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  desc: { type: String, required: true },
  images: [{ type: String, required: true }],
});

const Product = mongoose.model('Product', productSchema);

// Define banner schema and model
const bannerSchema = new mongoose.Schema({
  images: [{ type: String, required: true }],
});

const Banner = mongoose.model('Banner', bannerSchema);

// POST API to upload product details
app.post('/api/products', upload.array('images', 5), async (req, res) => {
  const { name, price, desc } = req.body;
  const images = req.files ? req.files.map(file => file.filename) : [];

  try {
    if (!name || !price || !desc || images.length === 0) {
      throw new Error('Name, price, description, and at least one image are required');
    }

    const product = new Product({
      name,
      price,
      desc,
      images,
    });

    await product.save();
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET API to fetch product details
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE API to delete a product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete associated images from local storage
    product.images.forEach(image => {
      const imagePath = path.join(__dirname, 'uploads', image);
      fs.unlink(imagePath, err => {
        if (err) {
          console.error('Error deleting image:', err);
        }
      });
    });

    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST API to upload banner images
app.post('/api/banners', upload.array('images', 10), async (req, res) => {
  const images = req.files ? req.files.map(file => file.filename) : [];

  try {
    if (images.length === 0) {
      throw new Error('At least one image is required');
    }

    const banner = new Banner({
      images,
    });

    await banner.save();
    res.status(201).json({ message: 'Banner created', banner });
  } catch (error) {
    console.error('Error creating banner:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// GET API to fetch banner images
app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE API to delete a banner
app.delete('/api/banners/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Delete associated images from local storage
    banner.images.forEach(image => {
      const imagePath = path.join(__dirname, 'uploads', image);
      fs.unlink(imagePath, err => {
        if (err) {
          console.error('Error deleting image:', err);
        }
      });
    });

    res.status(200).json({ message: 'Banner deleted' });
  } catch (error) {
    console.error('Error deleting banner:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Server is running on http://192.168.29.128:${PORT}`);
  console.log(`Products API: http://192.168.29.128:${PORT}/api/products`);
  console.log(`Banners API: http://192.168.29.128:${PORT}/api/banners`);
});

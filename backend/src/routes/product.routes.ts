// src/routes/product.routes.ts
import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authorize } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

router.get('/', productController.getProducts.bind(productController));
router.get('/search', productController.searchProducts.bind(productController));
router.get('/categories', productController.getCategories.bind(productController));
router.get('/:id', productController.getProductById.bind(productController));
router.post('/', authorize('ADMIN', 'MANAGER'), 
  productController.createProduct.bind(productController));
router.put('/:id', authorize('ADMIN', 'MANAGER'), 
  productController.updateProduct.bind(productController));
router.delete('/:id', authorize('ADMIN'), 
  productController.deleteProduct.bind(productController));

export default router;
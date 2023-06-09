// Typeorm
import { getCustomRepository } from 'typeorm';
import { ProductRepository } from '../typeorm/repositories/ProductsRepository';
// App
import AppError from '@shared/errors/AppError';
import Product from '../typeorm/entities/Product';
// Cache
import RedisCache from '@shared/cache/RedisCache';
import { productListKey } from './redis.keys';

interface IRequest {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

class UpdateProductService {
  public async execute({
    id,
    name,
    price,
    quantity,
  }: IRequest): Promise<Product> {
    const productsRepository = getCustomRepository(ProductRepository);
    const product = await productsRepository.findOne(id);

    if (!product) throw new AppError('Product not found.');

    const productExists = await productsRepository.findByName(name);
    if (productExists && name !== product.name)
      throw new AppError('There is already one product with that name');

    const redisCache = new RedisCache();

    await redisCache.invalidate(productListKey);

    product.name = name;
    product.price = price;
    product.quantity = quantity;

    await productsRepository.save(product);

    return product;
  }
}

export default UpdateProductService;

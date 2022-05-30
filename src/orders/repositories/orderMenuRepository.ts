import { EntityRepository, Repository } from 'typeorm';
import { OrderMenu } from '../entities/orderMenu.entity';

@EntityRepository(OrderMenu)
export class OrderMenuRepository extends Repository<OrderMenu> {}

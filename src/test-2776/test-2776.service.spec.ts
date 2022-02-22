import { MikroORM, wrap } from '@mikro-orm/core';
import { Company } from './company.entity';
import { Customer } from './customer.entity';
import { Company as CompanyStructure } from './structure.company.entity';
import { Customer as CustomerStructure } from './structure.customer.entity';


describe('Test2776Service', () => {
  
  let orm  : MikroORM;
  const query = `ALTER TABLE s2.customer
                  ADD CONSTRAINT fk_s1company_s2customer
                  FOREIGN KEY(company_id)
                  REFERENCES s1.company(id);`; 

  beforeAll( async () => {
    orm = await MikroORM.init({
      entities : [ CompanyStructure ],
      dbName : 'mikro_orm_test_gh_2776',
      type : 'postgresql',
      user : 'postgres',
      password : '13051997ec',
      allowGlobalContext : true
    });

    await orm.getSchemaGenerator().refreshDatabase();
    await orm.getSchemaGenerator().updateSchema({ schema : 's1'});
    await orm.em.nativeDelete(Company,{},{ schema : 's1' });

    orm = await MikroORM.init({
      entities : [ CustomerStructure ],
      dbName : 'mikro_orm_test_gh_2776',
      type : 'postgresql',
      user : 'postgres',
      password : '13051997ec',
      allowGlobalContext : true
    });

    await orm.getSchemaGenerator().refreshDatabase();
    await orm.getSchemaGenerator().updateSchema({ schema : 's2'});
    await orm.em.nativeDelete(Customer,{},{ schema : 's2' });
    await orm.em.getConnection().execute(query);

    orm = await MikroORM.init({
      entities : [ Company, Customer ],
      dbName : 'mikro_orm_test_gh_2776',
      type : 'postgresql',
      user : 'postgres',
      password : '13051997ec',
      allowGlobalContext : true
    });

  });

  afterAll( () => {
    orm.close(true)
  });

  test('wildcard entities', async () => {
    const c = new Customer();
    c.name = 'e';
    c.company = new Company();
    c.company.name = 'c';
    wrap(c).setSchema('s2');
    wrap(c.company).setSchema('s1');
    await orm.em.fork().persistAndFlush(c);
    const res = await orm.em.getRepository(Customer).findAll({ populate : true, schema : 's2' });
    expect(res).toHaveLength(1);
    expect(wrap(res[0].company).isInitialized()).toBe(true);
    expect( res[0].name ).toBe('e');
    expect( res[0].company.name).toBe('c');
  });

});

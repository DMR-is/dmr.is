import { Column } from 'sequelize-typescript'
import { BaseModel } from './base.model'

type EnumEntityType = { [key: string]: string | number }

type BaseEntityAttributes<EntityType extends EnumEntityType | string> = {
  title: EntityType extends string ? string : EntityType
  slug: string
}

export class BaseEntityModel<
  EntityType extends EnumEntityType | string,
> extends BaseModel<BaseEntityAttributes<EntityType>> {
  @Column
  title!: EntityType extends string ? string : EntityType

  @Column
  slug!: string
}

// enum TestEnum {
//   A = 'A',
//   B = 'B',
// }

// const entity = new BaseEntityModel<TestEnum>({
//   title: TestEnum,
//   slug: 'a',
//   id: '1',
//   created: new Date(), // Example created date
//   updated: new Date(), // Example updated date
// })

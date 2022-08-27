
``` typescript

  type FieldsType = {
    key: string 
    dataKind: string // ObjectId
    type: 'normal' | 'object' | 'array'
    children?: FieldsType[] | FieldsType
  }[]

```
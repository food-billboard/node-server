# MongoDB

## aggregate 
1. $filter   
```javascript 
  {
    $filter: {
      "input" : "$fields", //原schema中的字段
      "as" : "item", //遍历的item名称
      "cond" : { //查询条件
        "$eq" : ["$$item.sex", true]
      }
    }
  }
```
2. $map  
```javascript 
  {
    $map: {
      "input":"$fields", //原schema中的字段
      "as":"n", //遍历的item名称
      "in":{ //遍历后的值
        "subGroupId":"$$n.subGroupId",
        "primarySubGroup":{"$filter":{"input":"$$n.primarySubGroup","as":"mp","cond":{"$eq":["$$mp.primary","Y"]}}}
      }
    }
  }
```
3. $lookup  
  - 复杂多表联查
```javascript 
  {
    $lookup: {
      from: 'fields', 
      let: { customFields: "$movie" }, //生成自定义字段
      pipeline: [  //相当于嵌套一层aggregate(内部作用域为上一层内部)
        {
          $lookup: {
            from: 'images',
            as: 'poster',
            foreignField: "_id",
            localField: "poster"
          }
        },
        {
          $unwind: "$poster"
        }
      ],
      as: 'movie',
    }
  }
```
4. $unwind  
 - 避免`null`情况出现导致字段丢失  
```javascript
  //比如 unwind country 但是他为空
  {
    $unwind: {
      path: "$country",
      preserveNullAndEmptyArrays: true 
    }
  }
```

5. $addToSet  
- 向数据库中批量添加数据  
```javascript 
{
  $addToSet: {
    fields: {
      $each: [ item1, item2 ]
    }
  }
}

```
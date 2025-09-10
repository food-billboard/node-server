const {
  LongTimeTaskModel,
} = require('@src/utils')

function longTimeTaskCreate({
  // 调用页面
  page,
  // 应用
  app,
  // 用户id
  userId,
  method,
  url,
  schema,
}) {
  const model = new LongTimeTaskModel({
    // 创建人
    create_user: ObjectId(userId),
    // 应用名
    app,
    // 页面
    page,
    // 状态
    status: TASK_STATUS.PROCESS,
    request_url: url,
    request_method: method,
    // 接口数据
    // [{
    //     label: 'xxxx',
    //     value: 'xxx',
    //     type: 'string number boolean object array',
    //     required: true ,
    // }]
    request_data: schema
  })
  return model.save()
}

function updateLongTimeTask(taskId, setData) {
  // status response deal_time 
  return LongTimeTaskModel.updateOne({
    _id: ObjectId(taskId, {
      $set: setData
    })
  })
}

module.exports = {
  longTimeTaskCreate,
  updateLongTimeTask
}
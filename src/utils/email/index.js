const nodemailer = require('nodemailer')
const { EMAIL_AUTH } = require('../constant')

const DEFAULT_TRANSPORT = {
  host : 'smtp.qq.com',
  port: 465,
  secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
  auth : {
    user : EMAIL_AUTH.email,
    pass : EMAIL_AUTH.pass
  },
}

let transporter

//https://nodemailer.com/message/

const createMailTtransporter = (transport={}) => {
  /**
   * from - The email address of the sender. All email addresses can be plain ‘sender@server.com’ or formatted '“Sender Name” sender@server.com’, see Address object for details
      to - Comma separated list or an array of recipients email addresses that will appear on the To: field
      cc - Comma separated list or an array of recipients email addresses that will appear on the Cc: field
      bcc - Comma separated list or an array of recipients email addresses that will appear on the Bcc: field
      subject - The subject of the email
      text - The plaintext version of the message as an Unicode string, Buffer, Stream or an attachment-like object ({path: ‘/var/data/…'})
      html - The HTML version of the message as an Unicode string, Buffer, Stream or an attachment-like object ({path: ‘http://…'})
      attachments - An array of attachment objects (see Using attachments for details). Attachments can be used for embedding images as well.
   */
  if(!transporter) {
    transporter =  nodemailer.createTransport({ ...DEFAULT_TRANSPORT, ...transport }, {

    })
  }
  return transporter
}

const sendMail = (data, callback) => {
  createMailTtransporter()
  /**
   * data defines the mail content (see Message Configuration for possible options)
      callback is an optional callback function to run once the message is delivered or it failed
      err is the error object if message failed
      info includes the result, the exact format depends on the transport mechanism used
      info.messageId most transports should return the final Message-Id value used with this property
      info.envelope includes the envelope object for the message
      info.accepted is an array returned by SMTP transports (includes recipient addresses that were accepted by the server)
      info.rejected is an array returned by SMTP transports (includes recipient addresses that were rejected by the server)
      info.pending is an array returned by Direct SMTP transport. Includes recipient addresses that were temporarily rejected together with the server response
      response is a string returned by SMTP transports and includes the last SMTP response from the server
   */
  transporter.sendMail(data, callback)
}

module.exports = {
  sendMail,
}
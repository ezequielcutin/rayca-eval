const nodemailer = {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockImplementation((mailOptions, callback) => {
        callback(null, { response: 'Email sent' });
      }),
    }),
  };
  
  module.exports = nodemailer;
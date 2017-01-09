var sg = require('sendgrid')(process.env.SENDGRID_KEY);

exports.sendEmail = function (toAddress, name, fromAddress, subject, content) {
    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [
                {
                    to: [
                        {
                            email: toAddress,
                        }
                    ],
                    subject: subject,
                }
            ],
            from: {
                email: fromAddress,
                // name: firstname,
                name: name
            },
            content: [
                {
                    type: 'text/html',
                    value: content
                }
            ]
        }
    });
    return sg.API(request);
}
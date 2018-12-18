Please go through https://github.com/Laura-Doherty/ITSupportConversationTutorial/blob/master/README.md
first to understand the original instructions around this demo.

For this fork specifically.
This is a foundation to negotiate the first notice of loss process.

1. Client app initiates the chat and interacts with Watson directly
2. When the point to create a claim/event arrives - The call to Claims application is initiated directly.

The  Claims launch process conversation(Dialog, entity, intents etc) is captured in watson is exported in an xls and only available to DXC Technology.

within server/config - all settings are captured there.
Actual credentials can be obtained by dxc org staff by requesting the author.


You can launch the app by running npm install or npm run dev

for https use below link:

https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca

Because voice needs authenticated requestor and .env is at the root of application - to pass path properly we have to run
command in below manner

sudo /usr/bin/forever start ./server/server.js

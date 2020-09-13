# FreeCodeCamp Advanced Node and Express Challenges

Forked from the [supplied boilerplate repository](https://github.com/freeCodeCamp/boilerplate-advancednode) this repo will contain the output of the [Advanced Node and Express](https://www.freecodecamp.org/learn/quality-assurance/advanced-node-and-express/) certification from freeCodeCamp.

> We will continue on the path of exploring [ExpressJS](http://expressjs.com/) functionality including working with middleware packages in our Express Application.

## Services

The project depends on a remotely-visible instance of the app to be served, and something like [REPL.it](https://repl.it/) does a good job of that. You'll also need a publicly accessible Mongo database (hosted somewhere like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) and for the social authenitication step you'll have to [register an OAuth Application](https://github.com/settings/developers) on your Github Account.

## Local Development

You'll need an `.env` file with:

1. `GITHUB_CLIENT_ID`
1. `GITHUB_CLIENT_SECRET`
1. `MONGO_URI`
1. `SESSION_SECRET`

The rest is pretty straightforward, with `npm` for package management and `nodemon` for development server. Use `npm run dev` for starting up the local server.

## Dependencies

Notable packages and concepts include:

1. [PassportJS](https://passportjs.org/)
1. [PugJS](https://pugjs.org/api/getting-started.html)
1. [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme)
1. [Socket.io](https://socket.io/)
1. [MongoDB](https://www.npmjs.com/package/mongodb)

const { ApolloServer } = require("apollo-server");
const dotenv = require("dotenv");
const dns = require("dns");
const mongoose = require("mongoose");
const Items = require("./models/item");

dotenv.config();

mongoose.set("useCreateIndex", true);

mongoose.connect("mongodb+srv://omnistack:omnistack@cluster0-vlxex.mongodb.net/namegator?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const typeDefs = `
  type Item {
    id: String
    type: String
    description: String
  }
  type Domain {
    name: String
    extension: String
    checkout: String
    available: Boolean
  }
  type Query {
    items (type: String): [Item]
  }

  input ItemInput {
    type: String
    description: String
  }

  type Mutation {
    saveItem(item: ItemInput): Item
    deleteItem(id: String): Boolean
    generateDomains: [Domain]
    generateDomain(name: String): [Domain]
  }
  `;
//const items = []

const isDomainAvailable = function (url) {
  return new Promise(function (resolve, reject) {
    dns.resolve(url, function (error) {
      if (error) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const resolvers = {
  Query: {
    async items(_, args) {
      console.log("getItems ", args.type);
      const docs = await Items.find({ type: args.type });
      return docs;
    }
  },
  Mutation: {
    saveItem(_, args) {
      const item = new Items({
        type: args.item.type,
        description: args.item.description
      });
      return item.save();
    },
    deleteItem(_, args) {
      const id = args.id;
      Items.findByIdAndDelete({ _id: id }, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log(result);
        }
      });
      return true;
    },
    async generateDomains() {
      console.log("generateDomains");
      const domains = [];
      const prefixes = await Items.find({ type: "prefix" });
      const sufixes = await Items.find({ type: "sufix" });

      for (const prefix of prefixes) {
        for (const sufix of sufixes) {

          const name = prefix.description + sufix.description;
          const url = name.toLowerCase();
          const checkout = `https://checkout.hostgator.com.br/?a=add&sld=${url}&tld=.com`;
          const available = await isDomainAvailable(`${url}.com`);
          domains.push({
            name,
            checkout,
            available
          });
        }
      }
      return domains;
    },
    async generateDomain(_, args) {
      const name = args.name;
      const domains = [];
      const extensions = [".com.br", ".com", ".net", ".org"];
      for (const extension of extensions) {
        const url = name.toLowerCase();
        const checkout = `https://checkout.hostgator.com.br/?a=add&sld=${url}&tld=${extension}`;
        const available = await isDomainAvailable(`${url}${extension}`);
        domains.push({
          name,
          extension,
          checkout,
          available
        });
      }
      return domains;
    }
  }
}
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true
}
);

server.listen({ port: process.env.PORT || 4000 }, () =>
  console.log(`http://localhost:${process.env.PORT}${server.graphqlPath}`)
);
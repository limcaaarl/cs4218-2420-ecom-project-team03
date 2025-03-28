import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import { ObjectId } from "mongodb";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

// payment gateway
// values hardcoded for github actions
export const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: "hmrc3kfrt2xrvtvp",
  publicKey: "d3rnqcjwn7zk4fpt",
  privateKey: "767ed9ddd903781349d4c2af441f8eaa",
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    // validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is required" });
      case !description:
        return res.status(400).send({ error: "Description is required" });
      case !price:
        return res.status(400).send({ error: "Price is required" });
      case price < 0:
        return res.status(400).send({ error: "Price should not be negative" });
      case !category:
        return res.status(400).send({ error: "Category is required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is required" });
      case quantity < 0:
        return res.status(400).send({ error: "Quantity should not be negative" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "photo should be less then 1mb" });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

// get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All Products Fetched",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error,
    });
  }
};

// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");

    if (!product) {
      res.status(404).send({
        success: false,
        message: "No such product exists",
      });
    } else {
      res.status(200).send({
        success: true,
        message: "Single Product Fetched",
        product,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.pid)) {
      return res.status(404).send({
        success: false,
        message: "No such product exists",
        error: "No such product exists"
      });
    }

    const productPhoto = await productModel.findById(req.params.pid).select("photo");
    if (!productPhoto) {
      return res.status(404).send({
        success: false,
        message: "No such product exists",
        error: "No such product exists"
      });
    }
    
    if (productPhoto && productPhoto.photo.data) {
      res.set("Content-type", productPhoto.photo.contentType);
      res.status(200).send(productPhoto.photo.data);
    } else {
      res.status(200).send();
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

// delete controller
export const deleteProductController = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.pid)) {
      return res.status(404).send({
        success: false,
        message: "No such product exists",
        error: "No such product exists"
      });
    }
    const product = await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    if (!product) {
      res.status(404).send({
        success: false,
        message: "No such product exists",
        error: "No such product exists"
      });
    } else {
      res.status(200).send({
        success: true,
        message: "Product Deleted Successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

// update product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    // validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is required" });
      case !description:
        return res.status(400).send({ error: "Description is required" });
      case !price:
        return res.status(400).send({ error: "Price is required" });
      case price < 0:
        return res.status(400).send({ error: "Price should not be negative" });
      case !category:
        return res.status(400).send({ error: "Category is required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is required" });
      case quantity < 0:
        return res.status(400).send({ error: "Quantity should not be negative" });
      case photo && photo.size > 1000000:
        return res
          .status(400)
          .send({ error: "photo should be less then 1mb" });
    }

    if (!ObjectId.isValid(req.params.pid)) {
      return res.status(404).send({
        success: false,
        message: "No such product exists",
        error: "No such product exists"
      });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );

    if (!products) {
      return res.status(404).send({
        success: false,
        message: "No such product exists",
        error: "No such product exists"
      });
    }

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked && checked.length > 0) args.category = checked;
    if (radio && radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args).select("-photo");
    res.status(200).send({
      success: true,
      message: "Filtered Products Fetched",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while filtering products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      message: "Product count successful",
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      message: `Product list for page ${page} successful`,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");

    res.status(200).json(results && results.length > 0 ? results : []);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in search product API",
      error,
    });
  }
};

// similar products
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;

    if (!ObjectId.isValid(pid) || !ObjectId.isValid(cid)) {
      return res.status(404).send({
        success: false,
        message: "No such product or category exists",
        error: "No such product or category exists"
      });
    }
    
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    
    res.status(200).send({
      success: true,
      message: "Related Products Fetched",
      products: products && products.length > 0 ? products : [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting related product",
      error,
    });
  }
};

// get product by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "No such category found",
        error: "No such category found"
      });
    }

    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      message: "Products Fetched Successfully",
      category,
      products: products.length > 0 ? products : [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting products",
    });
  }
};

// payment gateway api
// token
export const braintreeTokenController = async (req, res) => {
  try {
    const tokenResponse = await new Promise((resolve, reject) => {
      gateway.clientToken.generate({}, function (err, response) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });

    res.status(200).send(tokenResponse);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

// payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    const transactionResult = await new Promise((resolve, reject) => {
      gateway.transaction.sale(
        { 
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        function (error, result) {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        }
      )}
    );

    const order = await new orderModel({
      products: cart,
      payment: transactionResult,
      buyer: req.user._id,
    }).save();
    res.status(200).json({ ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
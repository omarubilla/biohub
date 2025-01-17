"use server"

import { revalidatePath } from "next/cache";
import { scrapeAmazonProduct, scrapeBioProduct } from "../scraper";
import { connectToDB, isConnected } from "../scraper/mongoose";
import Product from "../models/product.model";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";


export async function scrapeAndStoreProduct(productUrl: string) {

    if(!productUrl) return;

    try {
        console.log("Connecting to the database...");
        await connectToDB(); 
        console.log("Database connection established.");

        // Ensure scraping happens only after a successful DB connection
        if (isConnected) {
            const scrapedProduct = await scrapeAmazonProduct(productUrl);
            console.log("Product scraped:", scrapedProduct);

            if (!scrapedProduct) return;

            let product = scrapedProduct;

            const existingProduct = await Product.findOne({url: scrapedProduct.url});

            if(existingProduct) {
                const updatedPriceHistory: any = [
                    ...existingProduct.priceHistory,
                    { price: scrapedProduct.currentPrice}
                ]

                product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory)
                }
            }

            const newProduct = await Product.findOneAndUpdate({
                url: scrapedProduct.url},
                product,
                {upsert: true, new: true }
            );

            revalidatePath(`/products/${newProduct._id}`);
        } else {
            console.log("Database connection failed. Skipping scraping.");
        }
    } catch (error: any) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    }
}

export async function getProductById(productId: string) {
    try {
        connectToDB();

        const product = await Product.findOne({ _id: productId });

        if(!product) return null;

        return product;

    } catch (error) {
        console.log(error);
    }
}

export async function getAllProducts() {
    try {
        connectToDB();

        const products = await Product.find();

        return products;

    } catch (error) {
        console.log(error);
    }
}

export async function getSimilarProducts(productId: string) {
    try {
        connectToDB();

        const currentProduct = await Product.findById(productId);

        if(!currentProduct) return null;

        const similarProducts = await Product.find({
            _id: {$ne: productId },
        }).limit(3);

        return similarProducts;

    } catch (error) {
        console.log(error);
    }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
    try {
        const product = await Product.findById(productId);

        if(!product) return;

        // Ensure required fields are set
        if (!product.originalPrice) {
            product.originalPrice = product.currentPrice || 0; // Set a default value or derive from currentPrice
        }

        const userExists = product.users.some((user: User) => user.email === userEmail);

        if(!userExists) {
            product.users.push({email: userEmail});

            await product.save();

            const emailContent = await generateEmailBody(product, "WELCOME")

            await sendEmail(emailContent, [userEmail]);
        }

    } catch (error) {
        console.log(error)
    }
}


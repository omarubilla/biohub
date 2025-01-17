import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from '../utils';
import dotenv from 'dotenv';

export async function scrapeAmazonProduct(url: string) {

    if(!url) return;

    //brightData proxy config
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 33335;
    const session_id = (1000000 * Math.random()) | 0;
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password, 
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }

    try {
        //fetch product page
        const response = await axios.get(url, options);
        const $ = cheerio.load(response.data);
        console.log(response.data);

        const title = $(`#productTitle`).text().trim();
        const currentPrice = extractPrice(
            $('span[data-a-color=price] span.a-offscreen').first(),
            $('.priceToPay span.a-price-whole').first(),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
            );

            const originalPrice = extractPrice(
                $('span[data-a-strike=true] span.a-offscreen').first()
            );

        const outOfStock = $('#availability span').text().trim().toLowerCase() === 
        'currently unavailable';

        const images = $('#imgBlkFront').attr('data-a-dynamic-image') ||
        $('#landingImage').attr('data-a-dynamic-image') ||
        '{}'

        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency($('.a-price-symbol'))
        ///const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");
        const discountRate = $('.savingsPercentage')
        .first() // Ensure only the first element is used
        .text()
        .trim()
        .replace(/[-%]/g, ""); // Remove unwanted characters

        const description = extractDescription($)

        //console.log({title, currentPrice, originalPrice, outOfStock, imageUrls, currency, discountRate})

        //construct data object with scraped info
        const data = {
            url, 
            currency: currency || '$',
            image: imageUrls[0],
            title, 
            currentPrice,
            originalPrice,
            priceHistory: [],
            discountRate: Number (discountRate),
            category: 'category',
            reviewsCount: 0, 
            stars: 4.5,
            isOutOfStock: outOfStock,
            description: description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }

        console.log({data})
        return data;

    } catch (error: any) {
        console.error(`Error details: ${error.response?.status} - ${error.response?.data}`);

        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}

export async function scrapeBioProduct(url: string) {
    if (!url) return;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const title = $('.product-name h1').text().trim();
        const size = $('p.size span').text().trim();
        const price = $('.price-box .price').text().replace('$', '').trim();
        const description = $('.short-description .std').text().trim();
        const productId = $('p.product-id span').text().trim();
        const isOutOfStock = !$('p.availability').text().toLowerCase().includes('in stock');

        const currency = extractCurrency($('.a-price-symbol'))

        // Extract all image URLs from the table
        const baseUrl = "https://www.ubpbio.com";
        const images: string[] = [];
        $('table img').each((_, img) => {
            const imageUrl = $(img).attr('src');
            if (imageUrl) {
                images.push(imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`);
            }
        });

        // Use the first image as the primary image
        const primaryImage = images.length > 0 ? images[0] : null;

        const data = {
            url,
            currency: currency || '$',
            title,
            size,
            currentPrice: parseFloat(price),
            priceHistory: [],
            description,
            productId,
            image: primaryImage, // Primary image for display
            additionalImages: images, // Array of all image URLs
            category: 'Bio Products',
            isOutOfStock,
            lowestPrice: parseFloat(price),
            highestPrice: parseFloat(price),
            averagePrice: parseFloat(price),
        };

        console.log({ data });
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error: ${error.response?.status} - ${error.response?.data}`);
            throw new Error(`Failed to scrape product: Axios error: ${error.message}`);
        } else if (error instanceof Error) {
            console.error(`General error: ${error.message}`);
            throw new Error(`Failed to scrape product: ${error.message}`);
        } else {
            console.error('Unknown error occurred');
            throw new Error('Failed to scrape product: An unknown error occurred');
        }
    }
}
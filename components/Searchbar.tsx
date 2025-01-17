"use client"

import React from 'react'
import {FormEvent, useState} from 'react'
import { scrapeAndStoreProduct } from '@/lib/actions';

const isValidAmazonProductURL = (url: string) => {
    try {
        const parsedURL = new URL(url);
        const hostname = parsedURL.hostname;

        if(
            hostname.includes('amazon.com') || 
            hostname.includes('amazon.') || 
            hostname.includes('amazon')
        ) {
            return true;
        }
    } catch (error) {
        return false;
    }

    return false;
}

const isValidCompetitorURL = (url: string) => {
    try {
        const parsedURL = new URL(url);
        const hostname = parsedURL.hostname;

        // Validate UBP Bio domain
        if (
            hostname.includes('ubpbio.com') 
        ) {
            return true;
        }
    } catch (error) {
        return false;
    }

    return false;
};

const SearchBar = () => {
    const [searchPrompt, setSearchPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const isValidLink = isValidAmazonProductURL(searchPrompt);

        if(!isValidLink) return alert('Please provide a valid Amazon link')

        try {
            setIsLoading(true);

            //scrape the product page
            const product = await scrapeAndStoreProduct(searchPrompt);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <form className='flex flex-wrap gap-4 mt-12'
    onSubmit={handleSubmit}
    >
        <input
            type="text"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder='Enter product link'
            className='searchbar-input'
        />

        <button type='submit' className='searchbar-btn'
        disabled={searchPrompt === ''}
        >
            {isLoading ? 'Searching...' : 'Search'}
        </button>

    </form>
  )
}

export default SearchBar
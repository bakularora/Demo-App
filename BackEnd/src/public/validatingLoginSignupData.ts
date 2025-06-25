import { body } from "express-validator";

import User from '../models/userModel.js';
import { validateHeaderValue } from "http";


const validateSignupData =

        [
            body('name').trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').trim().notEmpty().withMessage('Email cannot be empty').isEmail().withMessage('Enter valid email address').normalizeEmail()
        .custom(async (value: string, {})=>{

            const user = await User.findOne({email: value});

            if(user){
                throw new Error('Email already exists');
            }
        }),
        body('password')
        .trim()
        .notEmpty()
        .withMessage('Password should contain alphabets, digits, special characters and should be of minimum length of 6 empty')
        .isLength({min: 6})
        .withMessage('Password should contain alphabets, digits, special characters and should be of minimum length of 6 length')
        .custom((value: string, {})=>{

            const contDigits = /\d/;

            if(!contDigits.test(value)){
                throw new Error('Password should contain alphabets, digits, special characters and should be of minimum length of 6 digit');
            }
            return true;
        })
        .custom((value: string, {})=>{
            if(value.includes(" ")){
                throw new Error('Password should not contain space.')
            }
            return true;
        })
        .custom((value: string, {})=>{

            const regex = /[^a-zA-Z0-9]/;

            if(!regex.test(value)){
                throw new Error('Password should contain alphabets, digits, special characters and should be of minimum length of 6 special char');
            }
            return true;
        })
    ]


const validateLoginData = 
    [
        body('email').trim().notEmpty().withMessage('Email cannot be empty').normalizeEmail(),
        body('password').trim().notEmpty().withMessage('Password cannot be empty')
    ]

export default{
    validateLoginData,
    validateSignupData
}

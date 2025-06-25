var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { body } from "express-validator";
import User from '../models/userModel.js';
const validateSignupData = [
    body('name').trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').trim().notEmpty().withMessage('Email cannot be empty').isEmail().withMessage('Enter valid email address').normalizeEmail()
        .custom((value_1, _a) => __awaiter(void 0, [value_1, _a], void 0, function* (value, {}) {
        const user = yield User.findOne({ email: value });
        if (user) {
            throw new Error('Email already exists');
        }
    })),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password should contain alphabets, digits, special characters and should be of minimum length of 6 empty')
        .isLength({ min: 6 })
        .withMessage('Password should contain alphabets, digits, special characters and should be of minimum length of 6 length')
        .custom((value, {}) => {
        const contDigits = /\d/;
        if (!contDigits.test(value)) {
            throw new Error('Password should contain alphabets, digits, special characters and should be of minimum length of 6 digit');
        }
        return true;
    })
        .custom((value, {}) => {
        if (value.includes(" ")) {
            throw new Error('Password should not contain space.');
        }
        return true;
    })
        .custom((value, {}) => {
        const regex = /[^a-zA-Z0-9]/;
        if (!regex.test(value)) {
            throw new Error('Password should contain alphabets, digits, special characters and should be of minimum length of 6 special char');
        }
        return true;
    })
];
const validateLoginData = [
    body('email').trim().notEmpty().withMessage('Email cannot be empty').normalizeEmail(),
    body('password').trim().notEmpty().withMessage('Password cannot be empty')
];
export default {
    validateLoginData,
    validateSignupData
};

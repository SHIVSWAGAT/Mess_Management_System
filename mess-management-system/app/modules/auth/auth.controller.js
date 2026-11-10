
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const response = require('../../../helper/response');
const UserModel = require('../user/user.model');
const MessModel = require('../mess/mess.model');
const AuthValidation = require('./auth.validation');

const authValidation = new AuthValidation();
const secretKey = require('../../../config/config').development.JWTsecret;

const saltRounds = 10;
const STUDENT_EMAIL_PATTERN = /^(b[1-5]\d{5})@iiit-bh\.ac\.in$/;
const INVALID_STUDENT_EMAIL = 'Invalid Email ID. Please use your registered institute email.';

module.exports = class AuthController {
    constructor() {}

    async login(req, res, next) {
        try {
            const user = req.body;
            const email = String(user.email || '').trim().toLowerCase();
            const studentEmailMatch = STUDENT_EMAIL_PATTERN.exec(email);
            let result;

            if (email.endsWith('@iiit-bh.ac.in')) {
                const instituteAdmin = await UserModel.findOne({ email, role: 'admin' });
                if (instituteAdmin) {
                    result = { success: true, data: instituteAdmin };
                } else {
                    if (!studentEmailMatch) {
                        return res.status(200).json(response.error(false, INVALID_STUDENT_EMAIL));
                    }

                    const student = await UserModel.findOne({
                        rollNumber: studentEmailMatch[1].toUpperCase(),
                        role: 'user',
                    });
                    result = student
                        ? { success: true, data: student }
                        : { success: false, message: INVALID_STUDENT_EMAIL };
                }
            } else {
                result = await authValidation.checkUser({ email });
                if (!result.success || result.data.role === 'user') {
                    result = { success: false, message: INVALID_STUDENT_EMAIL };
                }
            }

            if (result.success) {
                const matched = await bcrypt.compare(
                    user.password,
                    result.data.password
                );

                if (matched) {
                    req.user = result.data;
                    next();
                } else {
                    return res.status(200).json(
                        response.error(
                            false,
                            'Incorrect email or password',
                            'Incorrect email or password '
                        )
                    );
                }
            } else {
                return res.status(200).json(
                    response.error(false, result.message)
                );
            }
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    async signup(req, res) {
        try {
            const user = req.body;
            const { messusername } = user;

            user.password = bcrypt.hashSync(user.password, saltRounds);
            user.role = 'admin';

            const isEmail = await authValidation.checkEmailExistOrNot({
                email: user.email
            });

            const isMess = await authValidation.checkMessExistOrNot({
                messusername
            });

            if (isEmail.success) {
                if (isMess.success) {
                    const mess = await MessModel.create({ messusername });

                    user.messId = mess._id;
                    delete user.messusername;

                    const newUser = await UserModel.create(user);

                    return res.status(201).json(
                        response.single(true, 'New User Created', newUser)
                    );
                }

                return res.status(200).json(
                    response.error(false, isMess.message, isMess.message)
                );
            }

            return res.status(200).json(
                response.error(false, isEmail.message, isEmail.message)
            );
        } catch (e) {
            return res.status(500).json(
                response.error(false, 'An error occur', `${e}`)
            );
        }
    }

    async prepareToken(req, res, next) {
        try {
            const mess = await MessModel.findById(req.user.messId);

            req.auth = {
                id: req.user._id,
                username: req.user.username,
                messusername: mess.messusername,
                messId: mess._id,
                email: req.user.email,
                role: req.user.role
            };

            next();
        } catch (e) {
            throw e;
        }
    }

    generateToken(req, res, next) {
        req.tokenObject = {};

        req.tokenObject.token = jwt.sign(req.auth, secretKey, {
            expiresIn: '30 days'
        });

        next();
    }

    sendToken(req, res) {
        res.setHeader('x-auth-token', req.tokenObject.token);

        res.json(
            response.single(
                true,
                'Enjoy your token!',
                { token: req.tokenObject.token }
            )
        );
    }

    async isAuthenticate(req, res, next) {
        try {
            const token = req.headers['x-auth-token'];

            if (token) {
                req.auth = jwt.verify(token, secretKey);

                console.log('token-', req.auth);

                const user = await UserModel.findOne({
                    $and: [
                        { _id: req.auth.id },
                        { messId: req.auth.messId }
                    ]
                });

                return user
                    ? next()
                    : res.status(200).json(
                        response.error(false, 'Failed to authenticate user')
                    );
            }

            return res.json(
                response.error(
                    false,
                    'You are not authenticate',
                    'No token provided'
                )
            );
        } catch (e) {
            return res.json(
                response.error(false, e.name, e.message)
            );
        }
    }

    // FIXED: Correct role checking
    isUser(req, res, next) {
        if (
            req.auth.role === 'user' ||
            req.auth.role === 'admin'
        ) {
            next();
        } else {
            return res.status(403).json(
                response.error(
                    false,
                    'You are not admin or user',
                    null
                )
            );
        }
    }

    isAdmin(req, res, next) {
        if (req.auth.role === 'admin') {
            next();
        } else {
            res.status(200).json(
                response.error(false, 'You are not admin', null)
            );
        }
    }
};

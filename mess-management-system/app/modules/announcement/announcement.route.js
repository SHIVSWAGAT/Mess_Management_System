const express = require('express');
const { validId } = require('../../database/sqlite');

const response = require('../../../helper/response');
const AuthController = require('../auth/auth.controller');
const Announcement = require('./announcement.model');

const router = express.Router();
const auth = new AuthController();

router.get('/', auth.isUser, async (req, res) => {
    try {
        const items = await Announcement.find({
            messId: req.auth.messId,
        }).sort({ createdAt: -1 });

        return res.json(
            response.single(true, 'Announcements loaded', items)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(false, 'Unable to load announcements', error.message)
        );
    }
});

router.post('/', auth.isAdmin, async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const message = String(req.body.message || '').trim();

        if (!title || !message) {
            return res.status(400).json(
                response.error(false, 'Title and message are required')
            );
        }

        if (title.length > 120 || message.length > 500) {
            return res.status(400).json(
                response.error(false, 'Title or message is too long')
            );
        }

        const item = await Announcement.create({
            messId: req.auth.messId,
            title,
            message,
            createdBy: req.auth.id,
        });

        return res.status(201).json(
            response.single(true, 'Announcement posted', item)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(false, 'Unable to post announcement', error.message)
        );
    }
});

router.delete('/:id', auth.isAdmin, async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json(
                response.error(false, 'Invalid announcement id')
            );
        }

        const item = await Announcement.findOneAndDelete({
            _id: req.params.id,
            messId: req.auth.messId,
        });

        if (!item) {
            return res.status(404).json(
                response.error(false, 'Announcement not found')
            );
        }

        return res.json(
            response.single(true, 'Announcement removed', item)
        );
    } catch (error) {
        return res.status(500).json(
            response.error(false, 'Unable to remove announcement', error.message)
        );
    }
});

module.exports = router;

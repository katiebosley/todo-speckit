import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;

const notFoundMessage = (id) => ({ message: `User with id=${id} not found.` });

const exports = {};

exports.findOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).send(notFoundMessage(req.params.id));
    }

    const user = await getAccessibleUserOrNull(req, id);
    if (!user) {
      return res.status(404).send(notFoundMessage(id));
    }

    return res.send(user);
  } catch (err) {
    logger.error(`User findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).send(notFoundMessage(req.params.id));
    }

    const user = await getAccessibleUserOrNull(req, id);
    if (!user) {
      return res.status(404).send(notFoundMessage(id));
    }

    const { fName, lName, email, username, password } = req.body;

    if (password && password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    if (!fName?.trim()) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (!lName?.trim()) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (!username?.trim()) {
      return res.status(400).send({ message: "Username is required." });
    }

    const trimmedFName = fName.trim();
    const trimmedLName = lName.trim();
    const trimmedEmail = email.trim();
    const normalizedUsername = username.trim().toLowerCase();

    const existingUsername = await db.user.findOne({
      where: { username: normalizedUsername, id: { [Op.ne]: user.id } },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({
      where: { email: trimmedEmail, id: { [Op.ne]: user.id } },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    user.fName = trimmedFName;
    user.lName = trimmedLName;
    user.email = trimmedEmail;
    user.username = normalizedUsername;

    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();

    const updated = await db.user.findByPk(user.id);
    return res.send(updated);
  } catch (err) {
    logger.error(`User update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update profile." });
  }
};

export default exports;

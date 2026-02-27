import Users from "../models/userModel.js";
import jwt from 'jsonwebtoken';

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token not found" });

    const user = await Users.findOne({
      where: { refresh_token: refreshToken }
    });

    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid refresh token" });

      const { id: userID, username, email } = user;
      const accessToken = jwt.sign({ userID, username, email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '30m'
      });

      res.json({ accessToken });
    });
  } catch (error) {
    console.error('Error in refreshToken:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};
import IpHistories from '../models/ipHistoryModel.js';

export const getIpHistory = async (req, res) => {
    try {
        const ipHistory = await IpHistories.findOne({
            where: {ipAddress: req.params.ipAddress}
        });
        if (!ipHistory) {
            return res.status(404).json({message: "Ip History not found"});
        }
        res.status(200).json(ipHistory);
    } catch (error) {
        res.status(500).json({message: "Internal Server Error getting ip history"});
    }
};

export const getIpHistories = async (req, res) => {
    try {
        const ipHistories = await IpHistories.findAll();
        if (!ipHistories) {
            return res.status(404).json({message: "Ip Histories not found"});
        }
        res.status(200).json(ipHistories);
    } catch (error) {
        res.status(500).json({message: "Internal Server Error getting ip histories"});
    }
};

export const createIpHistory = async (req, res) => {
    try {
        const { ipAddress, lastLogin, cartItems } = req.body;
        const ipHistory = await IpHistories.create({
            ipAddress: ipAddress,
            lastLogin: lastLogin,
            cartItems: cartItems || []
        });
        
        res.status(201).json(ipHistory);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error creating ip history" });
    }
};

// Update (Or Create of not exist) an ip entry into the db
export const updateIpHistory = async (req, res) => {
    try {
        const { ipAddress, lastLogin, cartItems } = req.body;
        const ipHistory = await IpHistories.update({ipAddress: req.params.ipAddress || ipAddress, lastLogin: lastLogin, cartItems: cartItems}, {
            where: {ipAddress: req.params.ipAddress}
        });
        if (!ipHistory) {
            const newIp = await IpHistories.create({
                ipAddress: ipAddress,
                lastLogin: lastLogin,
                cartItems: cartItems || []
            });
            return res.status(200).json({message: "Ip History not found, New IP created instead.", newIp});
        }
        res.status(200).json({message: "IPHistory Updated successfully. ", ipHistory});
    } catch (error) {
        res.status(500).json({message: "Internal Server Error updating ip history"});
    }
};

export const deleteIpHistory = async (req, res) => {
    try {
        const ipHistory = await IpHistories.destroy({
            where: {ipAddress: req.params.ipAddress}
        });
        if (!ipHistory) {
            return res.status(404).json({message: "Ip History not deleted"});
        }
        res.status(200).json(ipHistory);
    } catch (error) {
        res.status(500).json({message: "Internal Server Error deleting ip history"});
    }
};
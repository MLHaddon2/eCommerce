// import IpHistories from '../models/ipHistoryModel.js';

// const handleError = (res, context, error) => {
//   console.error(context, error);
//   return res.status(500).json({
//     message: `${context} failed`,
//     error: error?.message || String(error)
//   });
// };

// export const getIpHistory = async (req, res) => {
//   try {
//     const ipHistory = await IpHistories.findOne({ where: { ipAddress: req.params.ipAddress } });
//     if (!ipHistory) {
//       return res.status(404).json({ message: 'IP history not found' });
//     }
//     return res.status(200).json(ipHistory);
//   } catch (error) {
//     return handleError(res, 'Get IP history', error);
//   }
// };

// export const getIpHistories = async (req, res) => {
//     try {
//         const ipHistories = await IpHistories.findAll();
//         if (!ipHistories) {
//             return res.status(404).json({message: "Ip Histories not found"});
//         }
//         res.status(200).json(ipHistories);
//     } catch (error) {
//         return handleError(res, 'Get IP histories', error);
//     }
// };

// export const createIpHistory = async (req, res) => {
//     try {
//         const { ipAddress, lastLogin, cartItems } = req.body;
//         const ipHistory = await IpHistories.create({
//             ipAddress: ipAddress,
//             lastLogin: lastLogin,
//             cartItems: cartItems || []
//         });
//         res.status(201).json(ipHistory);
//     } catch (error) {
//         return handleError(res, 'Create IP history', error);
//     }
// };

// // Update (Or Create of not exist) an ip entry into the db
// export const updateIpHistory = async (req, res) => {
//     try {
//         const { ipAddress, lastLogin, cartItems } = req.body;
//         const [affectedCount] = await IpHistories.update(
//             { lastLogin: lastLogin, cartItems: cartItems },
//             { where: { ipAddress: req.params.ipAddress } }
//         );
//         if (affectedCount === 0) {
//             const newIp = await IpHistories.create({
//                 ipAddress: ipAddress || req.params.ipAddress,
//                 lastLogin: lastLogin,
//                 cartItems: cartItems || []
//             });
//             return res.status(200).json({message: "Ip History not found, New IP created instead.", newIp});
//         }
//         res.status(200).json({message: "IPHistory Updated successfully.", affectedCount});
//     } catch (error) {
//         return handleError(res, 'Update IP history', error);
//     }
// };

// // export const deleteIpHistory = async (req, res) => {
// //     try {
// //         const ipHistory = await IpHistories.destroy({
// //             where: {ipAddress: req.params.ipAddress}
// //         });
// //         if (!ipHistory) {
// //             return res.status(404).json({message: "Ip History not deleted"});
// //         }
// //         res.status(200).json(ipHistory);
// //     } catch (error) {
// //         res.status(500).json({message: "Internal Server Error deleting ip history", error });
// //     }
// // };

// !----------------------------------------------------------------------------------------------------------------------------

// import IpHistory from '../models/ipHistoryModel.js';

// const handleError = (res, context, error) => {
//   console.error(context, error);
//   return res.status(500).json({
//     message: `${context} failed`,
//     error: error?.message || String(error)
//   });
// };

// export const getIpHistory = async (req, res) => {
//   try {
//     const ipHistory = await IpHistory.findOne({ where: { ipAddress: req.params.ipAddress } });
//     if (!ipHistory) return res.status(404).json({ message: 'IP history not found' });

//     return res.status(200).json(ipHistory);
//   } catch (error) {
//     return handleError(res, 'Get IP history', error);
//   }
// };

// export const getIpHistories = async (req, res) => {
//   try {
//     const ipHistories = await IpHistory.findAll();
//     return res.status(200).json(ipHistories);
//   } catch (error) {
//     return handleError(res, 'Get IP histories', error);
//   }
// };

// export const createIpHistory = async (req, res) => {
//   try {
//     const { ipAddress, lastLogin, cartItems } = req.body;

//     const ipHistory = await IpHistory.create({
//       ipAddress,
//       lastLogin,
//       cartItems: cartItems || []
//     });

//     return res.status(201).json(ipHistory);
//   } catch (error) {
//     return handleError(res, 'Create IP history', error);
//   }
// };

// export const updateIpHistory = async (req, res) => {
//   try {
//     const { ipAddress, lastLogin, cartItems } = req.body;

//     const [affected] = await IpHistory.update(
//       { lastLogin, cartItems },
//       { where: { ipAddress: req.params.ipAddress } }
//     );

//     if (affected === 0) {
//       const newIp = await IpHistory.create({
//         ipAddress: ipAddress || req.params.ipAddress,
//         lastLogin,
//         cartItems: cartItems || []
//       });

//       return res.status(200).json({
//         message: 'IP history not found, created new entry.',
//         newIp
//       });
//     }

//     return res.status(200).json({ message: 'IP history updated successfully.' });

//   } catch (error) {
//     return handleError(res, 'Update IP history', error);
//   }
// };


import IpHistory from '../models/ipHistoryModel.js';

const handleError = (res, context, error) => {
  console.error(context, error);
  return res.status(500).json({
    message: `${context} failed`,
    error: error?.message || String(error)
  });
};

export const getIpHistory = async (req, res) => {
  try {
    const ipHistory = await IpHistory.findOne({ where: { ipAddress: req.params.ipAddress } });
    if (!ipHistory) return res.status(404).json({ message: 'IP history not found' });

    return res.status(200).json(ipHistory);
  } catch (error) {
    return handleError(res, 'Get IP history', error);
  }
};

export const getIpHistories = async (req, res) => {
  try {
    const ipHistories = await IpHistory.findAll();
    return res.status(200).json(ipHistories);
  } catch (error) {
    return handleError(res, 'Get IP histories', error);
  }
};

export const createIpHistory = async (req, res) => {
  try {
    const { ipAddress, lastLogin, cartItems, userId } = req.body;

    const ipHistory = await IpHistory.create({
      ipAddress,
      userId: userId || null,
      lastLogin,
      cartItems: cartItems || []
    });

    return res.status(201).json(ipHistory);
  } catch (error) {
    return handleError(res, 'Create IP history', error);
  }
};

export const updateIpHistory = async (req, res) => {
  try {
    const { ipAddress, lastLogin, cartItems, userId } = req.body;

    const [affected] = await IpHistory.update(
      { ipAddress, lastLogin, cartItems, userId: userId || null },
      { where: { ipAddress: req.params.ipAddress } }
    );

    if (affected === 0) {
      const newIp = await IpHistory.create({
        ipAddress: ipAddress || req.params.ipAddress,
        userId: userId || null,
        lastLogin,
        cartItems: cartItems || []
      });

      return res.status(200).json({
        message: 'IP history not found, created new entry.',
        newIp
      });
    }

    return res.status(200).json({ message: 'IP history updated successfully.' });

  } catch (error) {
    return handleError(res, 'Update IP history', error);
  }
};

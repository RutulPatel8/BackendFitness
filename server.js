const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/db');
const Customer = require('./Models/Customer');
const Transaction = require('./Models/Transaction');
const Otp = require('./Models/otp');  
const app = express();
const cors = require('cors');
const { Op } = require('sequelize');

app.use(cors({
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
}));

app.use(bodyParser.json());

sequelize.sync({ force: false }).then(() => {
    console.log('Database & tables created!');
});
// Endpoint to verify OTP
app.post('/verify-otp', async (req, res) => {
    const { mobileNo, otpCode } = req.body;

    if (!mobileNo || !otpCode) {
        return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    try {
        // Check if OTP exists for the given mobile number and the entered OTP matches
        const validOtp = await Otp.findOne({
            where: {
                mobile_no: mobileNo,
                otp_code: otpCode
            }
        });

        if (!validOtp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP verified - Proceed with user login or registration
        res.status(200).json({ message: 'OTP verified successfully!' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});


app.patch('/transactions/:id/mark-paid', async (req, res) => {
    const { id } = req.params;

    try {
        const transaction = await Transaction.findByPk(id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.IsPaid) {
            return res.status(400).json({ message: 'Transaction is already marked as paid' });
        }

        // Mark the transaction as paid
        transaction.IsPaid = true;
        console.log('Before Save:', transaction.toJSON()); // Debug log
        await transaction.save();
        console.log('After Save:', transaction.toJSON()); // Debug log

        res.status(200).json({ message: 'Transaction marked as paid', transaction });
    } catch (error) {
        console.error('Error marking transaction as paid:', error);
        res.status(500).json({ message: 'Failed to mark transaction as paid' });
    }
});

app.get('/transactions/group', async (req, res) => {
    try {
        // Fetch all transactions grouped by CustomerId
        const transactions = await Transaction.findAll({
            include: {
                model: Customer,
                attributes: ['CustomerName'],
            },
        });

        // Group transactions by CustomerId
        const groupedByCustomer = transactions.reduce((acc, transaction) => {
            const customerId = transaction.CustomerId;
            const customerName = transaction.Customer?.CustomerName || 'No Name Available';

            if (!acc[customerId]) {
                acc[customerId] = {
                    CustomerId: customerId,
                    CustomerName: customerName,
                    TotalAmount: 0,
                    PaidAmount: 0,
                    UnpaidAmount: 0,
                    Transactions: [],
                };
            }

            // Add transaction to the group
            acc[customerId].Transactions.push(transaction);

            // Update totals
            acc[customerId].TotalAmount += transaction.Price;
            if (transaction.IsPaid) {
                acc[customerId].PaidAmount += transaction.Price;
            } else {
                acc[customerId].UnpaidAmount += transaction.Price;
            }

            return acc;
        }, {});

        // Convert grouped data into an array
        const groupedTransactions = Object.values(groupedByCustomer);

        res.json(groupedTransactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: error.message });
    }
});



// Endpoint to request OTP
app.post('/request-otp', async (req, res) => {
    const { mobileNo } = req.body;

    if (!mobileNo) {
        return res.status(400).json({ error: 'Mobile number is required' });
    }

    try {
        // Use a fixed OTP
        const fixedOtp = '565656';

        // Check if an OTP already exists for this mobile number
        const existingOtp = await Otp.findOne({
            where: { mobile_no: mobileNo }
        });

        if (existingOtp) {
            // If OTP exists, update it to the fixed OTP
            await existingOtp.update({ otp_code: fixedOtp });
            console.log(`Fixed OTP for ${mobileNo}: ${fixedOtp}`);
            return res.status(200).json({ message: 'OTP sent successfully!' });
        } else {
            // If no OTP exists, create a new record with the fixed OTP
            await Otp.create({ mobile_no: mobileNo, otp_code: fixedOtp });
            console.log(`Fixed OTP for ${mobileNo}: ${fixedOtp}`);
            return res.status(200).json({ message: 'OTP sent successfully!' });
        }
    } catch (error) {
        console.error('Error handling OTP:', error);
        res.status(500).json({ error: 'Failed to handle OTP' });
    }
});


app.post('/customers', async (req, res) => {
    try {
        const { CustomerName, MobileNo } = req.body;

        if (!CustomerName || !MobileNo) {
            return res.status(400).json({ error: 'Customer Name and Mobile Number are required.' });
        }
    // Insert the data into the database
    const customer = await Customer.create({ CustomerName, MobileNo });
        // Save customer data to the database (replace with actual DB logic)
        console.log('Customer added:', { CustomerName, MobileNo });
        res.status(201).json({ message: 'Customer added successfully!',customer });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// DELETE route for deleting a customer by ID
app.delete('/transactions/:id', async (req, res) => {
    const transactions = req.params.id;

    try {
        const transactionsId = await Transaction.findByPk(transactions);
        if (!transactionsId) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await transactionsId.destroy(); // Delete the customer from the database
        res.status(200).json({ message: 'Transcation deleted successfully' });
    } catch (err) {
        console.error('Error deleting Transaction:', err);
        res.status(500).json({ message: 'Failed to delete Transaction' });
    }
});
app.delete('/customers/:id', async (req, res) => {
    const customers = req.params.id;

    try {
        const customersId = await Customer.findByPk(customers);
        if (!customersId) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await customersId.destroy(); // Delete the customer from the database
        res.status(200).json({ message: 'Transcation deleted successfully' });
    } catch (err) {
        console.error('Error deleting Transaction:', err);
        res.status(500).json({ message: 'Failed to delete Transaction' });
    }
});
// PATCH route to update a customer by ID
app.patch('/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { CustomerName, MobileNo } = req.body;

    try {
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Update the customer data
        customer.CustomerName = CustomerName || customer.CustomerName;
        customer.MobileNo = MobileNo || customer.MobileNo;

        await customer.save(); // Save the updated customer

        res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating customer' });
    }
});
app.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: {
                model: Customer, // Assuming Customer is the model name
                attributes: ['CustomerName'], // Select only the CustomerName field
            },
        });

        // Format the response to include customer name at the top level
        const formattedTransactions = transactions.map(transaction => ({
            ...transaction.toJSON(),
            CustomerName: transaction.Customer?.CustomerName || null, // Add CustomerName if available
        }));

        res.json(formattedTransactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/transactions', async (req, res) => {
    try {
        console.log('this is request body',req.body);
        const transaction = await Transaction.create(req.body);
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.post("/api/transactions/bulk", async (req, res) => {
    try {
      const transactions = req.body; // Array of transaction objects
  
      // Use bulkCreate to insert multiple records at once
      const createdTransactions = await Transaction.bulkCreate(transactions, { returning: true });
      res.status(201).json({
        message: "Transactions created successfully",
        data: createdTransactions
      });
    } catch (error) {
      console.error("Error creating transactions:", error);
      res.status(500).json({ error: "Failed to create transactions." });
    }
  });
  
  
// PATCH route to update a transaction by ID
app.patch('/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { CustomerId, VehicleNo, OperationDate,Price,VehicleType } = req.body;

    try {
        const transaction = await Transaction.findByPk(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Update the transaction data
        transaction.CustomerId = CustomerId || transaction.CustomerId;
        transaction.VehicleNo = VehicleNo || transaction.VehicleNo;
        transaction.Price = Price || transaction.Price;
        transaction.OperationDate = OperationDate || transaction.OperationDate;
        transaction.VehicleType = VehicleType ||transaction.VehicleType;

        await transaction.save(); // Save the updated transaction

        res.status(200).json({ message: 'Transaction updated successfully', transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating transaction' });
    }
});

app.get('/transactions/report', async (req, res) => {
    const { fromDate, toDate, customerId } = req.query;
    try {
        const whereCondition = {}
         // Handle date conditions
         if (fromDate && toDate) {
            whereCondition.OperationDate = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        } else if (fromDate) {
            whereCondition.OperationDate = {
                [Op.gte]: new Date(fromDate),
            };
        } else if (toDate) {
            whereCondition.OperationDate = {
                [Op.lte]: new Date(toDate),
            };
        }
        if (customerId) whereCondition.CustomerId = customerId;

        const report = await Transaction.findAll({
            where: whereCondition,
            include: [{ model: Customer, attributes: ['CustomerName','MobileNo'] }],
        });
        res.json(report);
    } catch (error) {
        console.log("eror",error)
        res.status(500).json({ error: error.message });
    }
});
app.get('/customers/filter', async (req, res) => {
    const { CustomerName } = req.query; // Get the CustomerName from query parameters

    try {
        const whereCondition = {};

        if (CustomerName) {
            // Add filtering for CustomerName (case-insensitive match)
            whereCondition.CustomerName = CustomerName;
        }

        // Fetch customers based on the filter
        const customers = await Customer.findAll({
            where: whereCondition,
        });

        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/transactions/filter', async (req, res) => {
    const { fromDate, toDate, customerId,price,vehicleType } = req.query;
    try {
        const whereCondition = {}
         // Handle date conditions
         if (fromDate && toDate) {
            whereCondition.OperationDate = {
                [Op.between]: [new Date(fromDate), new Date(toDate)],
            };
        } else if (fromDate) {
            whereCondition.OperationDate = {
                [Op.gte]: new Date(fromDate),
            };
        } else if (toDate) {
            whereCondition.OperationDate = {
                [Op.lte]: new Date(toDate),
            };
        }
        if (customerId) whereCondition.CustomerId = customerId;
        if (price) whereCondition.Price = price;
        if (vehicleType) whereCondition.VehicleType = vehicleType;
        const report = await Transaction.findAll({
            where: whereCondition,
            include: [{ model: Customer, attributes: ['CustomerName','MobileNo'] }],
        });
        res.json(report);
    } catch (error) {
        console.log("eror",error)
        res.status(500).json({ error: error.message });
    }
});
app.get('/dashboard', async (req, res) => {
    try {
      const totalCustomers = await Customer.count();
      const transactions = await Transaction.findAll();
      const totalCars = transactions.length;
      res.json({ totalCustomers, totalCars });
    } catch (error) {
      console.log("error", error)
      res.status(500).json({ error: error.message });
    }
  });
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

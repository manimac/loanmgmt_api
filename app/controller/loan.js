const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.loan;
const loanhistoryModel = MODELS.loanhistory;
const approvalsModel = MODELS.approvals;
const profileModel = MODELS.profile;


exports.list = async function (req, res) {
    try {
        const entries = await Model.findAll({
            order: [['updatedAt', 'DESC']],
            include: [profileModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.filterlist = async function (req, res) {
    try {
      const where = {};
      if (req.body.mobile) where.mobile = { [Op.startsWith]: req.body.mobile };
      if (req.body.status) where.status = req.body.status;
      if (req.body.status === 'Due' || req.body.status === 'Overdue') where.status = 2;
  
      const entries = await Model.findAll({
        where,
        order: [['updatedAt', 'DESC']],
        include: [profileModel],
      });
  
      entries.forEach(loan => {
        switch (loan.status) {
          case 0:
            loan['loanstatus'] = 'Pending';
            break;
          case 1:
            loan['loanstatus'] = 'Declined';
            break;
          case 2:
            const today = new Date();
            const renewaldate = new Date(loan.renewaldate);
            const diffDays = Math.ceil((today - renewaldate) / (1000 * 60 * 60 * 24));
  
            if (diffDays > 180) {
              loan['loanstatus'] = 'Overdue';
            } else if (diffDays > 150) {
              loan['loanstatus'] = 'Due';
            } else {
              loan['loanstatus'] = 'Active';
            }
  
            break;
          case 3:
            loan['loanstatus'] = 'Closed';
            break;
        }
      });
  
      if (req.body.status === 'Due' || req.body.status === 'Overdue') {
        const filteredEntries = entries.filter(element => element['loanstatus'] === req.body.status);
        res.send(filteredEntries);
      }
      else if (req.body.status === '2') {
        const filteredEntries = entries.filter(element => element['loanstatus'] === 'Active');
        res.send(filteredEntries);
      }
       else {
        res.send(entries || null);
      }
    } catch (err) {
      res.status(500).send(err);
    }
  };

exports.pendinglist = function (req, res) {
    Model.findAll({
        where: { 'status': 0 }, // filter by pending loans only
        order: [
            ['updatedAt', 'DESC']
        ]
    }).then(function (entries) {
        res.send(entries || null)
    });
}

exports.create = function (req, res) {
    var loan = req.body;
    loan.status = 0;
    Model.create(loan).then(function (rec) {
        loan.loan_id = rec.id;
        loanhistoryModel.create(loan).then(function (loanhistoryrec) {
            let obj = {
                type: 'Loan',
                status: 0,
                loanhistory_id: loanhistoryrec.id,
                loan_id: loan.loan_id,
                profile_id: req.body.profile_id,
                maker_id: req.body.maker_id,
            }
            approvalsModel.create(obj).then(function () {
                res.send(loan);
            }, function (err) {
                res.status(500).send(err);
            })
        }, function (err) {
            res.status(500).send(err);
        })
    }, function (err) {
        res.status(500).send(err);
    })
}

exports.update = async function (req, res) {
    try {
        const { id: loanId, ...loanHistoryData } = req.body;
        const loanHistoryRec = await loanhistoryModel.create(loanHistoryData);
        const approvalsData = {
            type: 'Loan',
            status: 0,
            loanhistory_id: loanHistoryRec.id,
            loan_id: loanId,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id
        };
        await approvalsModel.create(approvalsData);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.delete = async function (req, res) {
    try {
        const result = await Model.findByPk(req.params.id);
        await result.update({ status: 4 });
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
};

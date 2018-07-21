import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import { Member, Address } from '../models/member';
import { Tournament } from '../models/tournament';
import { AuthentificationRouter } from "./authentication.router";

export class MembersRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.router.get('/count', this.getCount);
        this.router.get('/:id', this.getOne);
        // à partir d'ici chaque méthode contrôle le token de la request -> admin ou membre connecté
        this.router.put('/:id', this.update);
        this.router.post('/address/:pseudo', this.addAddress);
        this.router.delete('/address/:pseudo/:id', this.deleteAddress);
        this.router.put('/address/:id', this.updateAddress);
        // à partir d'ici il faut être admin uniquement
        this.router.use(AuthentificationRouter.checkAdmin);   
        this.router.get('/', this.getAll);
		this.router.get('/tid/:id', this.getAllNotAssigned);
        this.router.post('/', this.create);
        this.router.delete('/', this.deleteAll);
        this.router.delete('/:id', this.deleteOne);
    }

    public getCount(req: Request, res: Response, next: NextFunction) {
        Member.count({}).exec((err, count) => {
            if (err) res.send(err);
            res.json(count);
        });
    }

    public getAll(req: Request, res: Response, next: NextFunction) {
        Member.find().populate('addresses').sort({ pseudo: 'asc' }).exec((err, members) => {
            if (err) res.send(err);
            res.json(members);
        });
    }
	
	public getAllNotAssigned(req: Request, res: Response, next: NextFunction) {
        Member.find({ 'tournaments': { $ne: req.params.id }}).populate('tournaments').sort({ name: 'asc'}).exec((err, members) => {
            if (err) res.send(err);
            res.json(members);
        })
	}

    public getOne(req: Request, res: Response, next: NextFunction) {
        Member.find({ pseudo: req.params.id }).populate('tournaments').populate('addresses').exec((err, members) => {
            if (err) res.send(err);
            res.json(members);
        });
    }

    public create(req: Request, res: Response, next: NextFunction) {
        delete req.body._id;    // _id vient avec la valeur nulle d'angular (via reactive forms) 
                                // => on doit l'enlever pour qu'il reçoive une valeur 
        let member = new Member(req.body);
        member.save(function (err, task) {
            if (err) res.send(err);
            res.json(task);
        });
    }

    public update(req: Request, res: Response, next: NextFunction) {
        if(req.params.id === req['decoded'].pseudo || req['decoded'].admin) {
            // pour toutes méthodes d'update liées aux simples membres 
            // et qui seront avant le router.use(...checkAdmin)
            let member = new Member(req.body);
            Member.findOneAndUpdate({ pseudo: req.params.id },
                req.body,
                { new: true },  // pour renvoyer le document modifié
                function (err, task) {
                    if (err)
                        res.send(err);
                    res.json(task);
                });
        } else {
            return res.status(403).send({
                success: false,
                message: 'Require admin privilege or own account modifications.'
            });
        }
    }

    public deleteOne(req: Request, res: Response, next: NextFunction) {
        Member.findOneAndRemove({ pseudo: req.params.id })
            .then(m => {
                // delete en cascade des adresses
                m.addresses.forEach(a => Address.findByIdAndRemove(a).exec());
                res.json(m);
            })
            .catch(err => res.send(err))
    }

    public deleteAll(req: Request, res: Response, next: NextFunction) {
        Member.remove({},
            function (err) {
                if (err)
                    res.send(err);
                res.json({ status: 'ok' });
            })
            .then(() => Address.remove({}).exec());
    }

    public addAddress(req: Request, res: Response, next: NextFunction) {
        let pseudo = req.params.pseudo;
        console.log('ENTER ADD FUNCTION')
        console.log(req['decoded'].pseudo)
        console.log(req['decoded'].admin)
        if(pseudo === req['decoded'].pseudo || req['decoded'].admin) {
            console.log('ENTER ADD ADDRESS')
            delete req.body._id;
            let address = new Address(req.body);
            Member.findOne({ pseudo: pseudo })
                .then(m => {
                    m.addresses.push(address);
                    address.member = m;
                    return address.save();
                })
                .then(a => {
                    a.member.save();
                    res.json(address);
                })
        } else {
            return res.status(403).send({
                success: false,
                message: 'Require admin privilege or own account modifications.'
            });
        }
    }

    public deleteAddress(req: Request, res: Response, next: NextFunction) {
        let pseudo = req.params.pseudo;
        console.log('ENTER DELETE FUNCTION')
        console.log(req['decoded'].pseudo)
        console.log(req['decoded'].admin)
        if(pseudo === req['decoded'].pseudo || req['decoded'].admin) {
            console.log('ENTER DELETE ADDRESS')
            let id = req.params.id;
            Member.findOne({ pseudo: pseudo })
                .then(m => {
                    let i = m.addresses.find(a => a._id == id);
                    m.addresses.splice(i, 1);
                    return m.save();
                })
                .then(m => {
                    return Address.remove({ _id: id })
                })
                .then(() => res.json(true))
                .catch(err => console.log(err))
        } else {
            return res.status(403).send({
                success: false,
                message: 'Require admin privilege or own account modifications.'
            });
        }
    }

    public updateAddress(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        if (req['decoded'].admin) {
            Address.findOneAndUpdate({ _id: id }, req.body, { new: true })
                .then(a => res.json(a))
                .catch(err => console.log(err))
        } else if (req['decoded'].pseudo) {
            Member.findOne({ pseudo: req['decoded'].pseudo }, (err, current) => {
                Address.findOneAndUpdate({ _id: id, member: current._id }, req.body, { new: true })
                    .then(a => res.json(a))
                    .catch(err => console.log(err))
            })
        } else {
            return res.status(403).send({
                success: false,
                message: 'Require admin privilege or own account modifications.'
            });
        }
        
    }
}

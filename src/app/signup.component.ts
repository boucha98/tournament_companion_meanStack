import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { FormBuilder, FormGroup, Validators, FormControl } from "@angular/forms";
import { MemberService, Member } from "app/members/member.service";

@Component({
    templateUrl: './signup.component.html'
})
export class SignupComponent {
    public frm: FormGroup;
    public ctlPseudo: FormControl;
    public ctlProfile: FormControl;
    public ctlBirthdate: FormControl;
    public ctlPassword: FormControl;
    public ctlConfPassword: FormControl;
    public ctlAdmin: FormControl;
    public message: string;

    constructor(
        public authService: AuthService, // pour pouvoir faire le login
        public router: Router,           // pour rediriger vers la page d'accueil en cas de login 
        private fb: FormBuilder,          // pour construire le formulaire, du c�t� TypeScript
        private memberService: MemberService, 
    ) {
        this.setMessage();

        this.ctlPseudo = this.fb.control('', [Validators.required, Validators.minLength(3)], [this.pseudoUsedValidator()]);
        this.ctlBirthdate = this.fb.control('', [Validators.required, this.validatorBirthday()], []);
        this.ctlProfile = this.fb.control('', []);
	    this.ctlPassword = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.ctlConfPassword = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.ctlAdmin = this.fb.control(false, []);
        
        this.frm = this.fb.group({
            _id: null,
            pseudo: this.ctlPseudo,
            date: this.ctlBirthdate,
            password: this.ctlPassword,
            confpassword: this.ctlConfPassword,
	        profile: this.ctlProfile,
            isAdmin: this.ctlAdmin,
        }, { validator: Validators.compose([this.passwordMatchValidator, this.crossValidations])});
        // Validators.compose : Compose multiple validators into a single function that returns the union of the individual error maps.
    }

    signup() {
        this.authService.signup(this.frm.value).subscribe(() => {
            if (this.authService.isLoggedIn) {
                let redirect = this.authService.redirectUrl || '/home';
                this.authService.redirectUrl = null;
                this.router.navigate([redirect]);
            }
        });
    }
    
    setMessage() {
        this.message = 'You are logged ' + (this.authService.isLoggedIn ? 'in' : 'out') + '.';
    }

    passwordMatchValidator(g: FormGroup): Validators {
        if(!g.value.password || !g.value.confpassword) return;
        const valid = g.value.password === g.value.confpassword ? null : {invalidConfirmation: true};
        g.get('confpassword').setErrors(valid);
        if(valid) g.get('confpassword').markAsDirty();
    }

    crossValidations(g: FormGroup): Validators {
        if(!g.value.password || !g.value.profile) return;
        const valid = g.value.password !== g.value.profile ? null : {passwordEqualProfile: true};
        g.get('profile').setErrors(valid);
        if(valid) {
            g.get('profile').markAsDirty();
        }
    }
    
    pseudoUsedValidator(): any {
        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            let pseudo = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.pristine)
                        resolve(null);
                    else
                        this.authService.isPseudoAvailable(pseudo).subscribe(member => {
                            resolve(member ? null : { pseudoUsed: true });
                        });
                }, 300);
            });
        };
    }

    validatorBirthday(): any {
        return (ctl: FormControl) => {
            if(ctl.pristine) return null;
            const today = this.parseDate(new Date());
            const birthday = this.parseDate(new Date(ctl.value));
            const valid = today.getTime() > birthday.getTime() ? null : {invalidBirthday: true};
            return valid;
        }
    }

    parseDate(d: Date): Date {
        const yyyy = d.getFullYear().toString();
        let mm = (d.getMonth()+1).toString();
        mm = mm.length === 2 ? mm : '0' + mm;
        let dd  = d.getDate().toString();
        dd = dd.length === 2 ? dd : '0' + dd;
        return new Date(yyyy + '-' + mm + '-' + dd);
    }
}

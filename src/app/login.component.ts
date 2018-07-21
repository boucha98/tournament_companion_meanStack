import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/auth.service';
import { FormBuilder, FormGroup, Validators, FormControl } from "@angular/forms";

@Component({
    templateUrl: './login.component.html'
})
export class LoginComponent {
    public frm: FormGroup;
    public ctlPseudo: FormControl;
    public ctlPassword: FormControl;
    public message: string;

    constructor(
        public authService: AuthService, // pour pouvoir faire le login
        public router: Router,           // pour rediriger vers la page d'accueil en cas de login 
        private fb: FormBuilder          // pour construire le formulaire, du côté TypeScript
    ) {
        this.setMessage();

        /**
         * Ici on construit le formulaire réactif. On crée un 'group' dans lequel on place deux
         * 'controls'. Remarquez que la méthode qui crée les controls prend comme paramètre une
         * valeur initiale et un tableau de validateurs. Les validateurs vont automatiquement
         * vérifier les valeurs encodées par l'utilisateur et reçue dans les FormControls grâce
         * au binding, en leur appliquant tous les validateurs enregistrés. Chaque validateur
         * qui identifie une valeur non valide va enregistrer une erreur dans la propriété 
         * 'errors' du FormControl. Ces erreurs sont accessibles par le template grâce au binding.
         */
        this.ctlPseudo = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.ctlPassword = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.frm = this.fb.group({
            pseudo: this.ctlPseudo,
            password: this.ctlPassword
        });
    }

    setMessage() {
        this.message = 'You are logged ' + (this.authService.isLoggedIn ? 'in' : 'out') + '.';
    }

    /**
     * Cette méthode est bindée sur le click du bouton de login du template. On va y faire le
     * login en faisant appel à notre AuthService. 
     */
    login() {
        this.message = 'Trying to log in ...';
        this.authService.login(this.frm.value.pseudo, this.frm.value.password).subscribe(() => {
            this.setMessage();
            if (this.authService.isLoggedIn) {
                // Get the redirect URL from our auth service
                // If no redirect has been set, use the default
                let redirect = this.authService.redirectUrl || '/home';
                this.authService.redirectUrl = null;
                // Redirect the user
                this.router.navigate([redirect]);
            }
            else
                this.message = "Login failed!";
        });
    }

    logout() {
        this.authService.logout();
        this.setMessage();
        this.frm.reset();   // réinitialise le formulaire avec les valeurs par défaut
    }
}
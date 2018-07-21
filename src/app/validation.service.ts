import { Injectable } from "@angular/core";

@Injectable()
export class ValidationService {
    public getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
        let config = {
            required: 'This field is required',
            minlength: `Minimum length is ${validatorValue.requiredLength}`,
            maxlength: `Maximum length is ${validatorValue.requiredLength}`,
            forbiddenValue: 'This value is forbidden',
            pseudoUsed: 'This pseudo is not available',
            passwordEqualProfile: 'Your password cannot be equal to your profile string',
            invalidConfirmation: 'passwords mismatch',
            nameUsed: 'This name is not avalaible',
            invalidDates: 'Finish date must be after start date',
            invalidStartDate: 'Start date must be after current day',
            invalidBirthday: 'Birthday date must be before current day',
            invalidMaxPlayersValue: 'Number of maximum players must be superior or equal to subscribed members',
        };
        return config.hasOwnProperty(validatorName) ? config[validatorName] : '[' + validatorName + ']';
    }
}

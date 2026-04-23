export class CreatePatientDto {
  email!: string;
  name!: string;
  password!: string;
  patientIdNumber?: string;
  nextOfKinName!: string;
  nextOfKinPhone!: string;
}

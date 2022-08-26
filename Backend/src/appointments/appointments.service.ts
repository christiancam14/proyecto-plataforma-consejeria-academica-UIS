import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindPsychoAppointmentDto } from './dto/find-psycho-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { FinishAppointmentDto } from './dto/finish-appointment.dto';
import { PutAppointmentRatingDto } from './dto/put-appointment-rating.dto';
import { PrismaClient, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

const prisma = new PrismaClient();

@Injectable()
export class AppointmentsService {
  constructor(private jwtService: JwtService) {}

  async findPsychoAppointments(
    findPsychoAppointmentDto: FindPsychoAppointmentDto,
  ) {
    try {
      if (
        !(await this.authStudent(findPsychoAppointmentDto.auth_token)) &&
        !(await this.authPsycho(findPsychoAppointmentDto.auth_token))
      )
        throw new UnauthorizedException();
      const appointments = await prisma.medical_appointment.findMany({
        where: {
          psycho_id: findPsychoAppointmentDto.psychologist_id,
        },
        select: {
          date_appointment: true,
          status_appointment: true,
        },
      });
      if (!appointments[0])
        return { message: 'No appointments found for this psychologist' };
      return appointments;
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    try {
      if (!(await this.authStudent(createAppointmentDto.auth_token)))
        throw new UnauthorizedException();
      const psycho = await prisma.psychology.findUnique({
        where: { id: createAppointmentDto.psychologist_id },
      });

      if (!psycho) return { message: 'Psychologist not found' };
      if (!psycho.active) return { message: 'Psychologist not active' };
      if (new Date(createAppointmentDto.date_appointment) < new Date())
        return { message: 'Invalid date' };
      // date must be in the future
      const verifAppointment = await prisma.medical_appointment.findMany({
        where: {
          psycho_id: createAppointmentDto.psychologist_id,
          date_appointment: new Date(createAppointmentDto.date_appointment),
        },
      });
      if (verifAppointment[0])
        return {
          message: 'This hour is not available for create an appointment',
        };
      var decodedJwtAccessToken: any = this.jwtService.decode(
        createAppointmentDto.auth_token,
      );
      var student_id: number = decodedJwtAccessToken.id;
      const student = await prisma.student.findUnique({
        where: { id: student_id },
      });
      var a: any = new Date(createAppointmentDto.date_appointment);
      const appointment = await prisma.medical_appointment.create({
        data: {
          student_id: student_id,
          psycho_id: createAppointmentDto.psychologist_id,
          date_request: new Date(),
          date_appointment: new Date(createAppointmentDto.date_appointment),
          status_appointment: 'active',
        },
      });
      const nodemailer = require('nodemailer');

      var transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com', // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        tls: {
          ciphers: 'SSLv3',
        },
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      var mailOptions = {
        from: process.env.EMAIL_USER.toString(),
        to: [student.email, psycho.email],
        subject: 'Appointment created',
        html: ` 
          
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" >
        <head >
        <!-- If you delete this meta tag, Half Life 3 will never be released. -->
        <meta name="viewport" content="width=device-width" >
        
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" >
        <title >Bienvenido al programa de Consejería Estudiantil</title>
          
        
        </head>
        
        <body  style="background-color:#E5E5E5 ; -webkit-font-smoothing: antialiased;-webkit-text-size-adjust: none;height: 100%;width: 100%!important;">
        
        
        <table class="head-wrap" style="width: 100%;">
          <tr >
          <td></td>
            <td class="header container" style="display: block!important;max-width: 600px!important;margin: 0 auto!important;clear: both!important;">
                <div class="content encabezado" style="padding: 15px 15px 0 0;max-width: 600px;margin: 0;display: block;background: transparent linear-gradient(180deg, #7BD1D1 0%, #06C1A4 100%) 0% 0% no-repeat padding-box;border-radius: 12px;">
                  <table style="width: 100%;">
                    <tr >
                      <td  class="logo-crz" style="text-align: top; padding-left: 20px;width:400px;">
                        <p class="titulo_encabezado" style="font-weight: 600;font-size: 36px;line-height: 39px;color: #FFFFFF;margin-left: 12px;margin-top: 0px; margin-bottom: 0px;">¡Hola!
                        <p  style="font-weight: 500;font-size: 18px;line-height: 23px;color: #FFFFFF; margin-left:12px;margin-top: 5px;">Vimos que tienes una nueva cita</p>
                        <p style="text-align: top; padding-left: 20px;"><img src="https://images.emojiterra.com/google/android-11/512px/1f60a.png" width="100"></p>
                        <p  style="font-weight: 400;font-size: 25px;line-height: 23px;color: #FFFFFF; margin-left: 12px;width:240px;">` + psycho.name + ` <br><span
                          style="font-weight: 400;font-size: 18px;line-height: 20px;color: #FFFFFF; margin-left: 0px;">
                          Tienes una nueva cita </span></p>
                        </p>
                        
                        
                      </td>
                      <td style="width:200px;" >
                        <img src="https://petroleosvirtual.uis.edu.co/posgrados/wp-content/uploads/2020/09/logo2-blanco-1.png" width="200">
                      </td>
                    </tr>
                  </table>
                </div>
            </td>
            <td></td>
          </tr>
        
        <!-- BODY -->
          <tr >
            <td>
            </td>
            <td class="container" style="background-color: #ffffff ;display: block!important;max-width: 600px!important;margin: 0 auto!important;clear: both!important;">
          
        
        
            <table style="width: 100%; padding-left: 0px; padding-right: 0px; padding-top: 10px; color:#808080; font-size:18px;">
              <tr style="border-bottom: 1px solid #808080">
                <td width="100%" style="padding: 10px; text-align: center;">
                  <p style="text-align: center; color:#9490DA; font-weight: 500;">`+ student.name +`</p> 
                  <p style="padding: 0px 5%;">Ha solicitado una cita a través de nuestra página web <br><span
                    style="color:#06C1A4; margin: 0 auto;">consejería académica</span><br> 😊 para ser contactado lo más pronto posible⏳</p>
                    <p style="padding: 0px 5%;">Te presentamos la información de la cita:</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #9490DA; border-radius: 10px 10px 0px 0;" width="100%">
                  <p style="color:#FFFFFF; padding-left:20px;">Sus datos:</p>
                </td>
              </tr>
              <tr style="background-color: #EEEEEE;">
                <td>
                  <table style="width:100%; padding: 20px 50px;">
                    <tbody>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8948.png"></td>
                        <td style="padding: 0px 10px 0px 10px;">Estudiante: <span style="color:#9490DA;">`+ student.name +`</span></td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8948.png"></td>
                        <td style="padding: 0px 10px 0px 10px;">Psicólogo: <span style="color:#9490DA;">`+ psycho.name +`</span></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #06C1A4; border-radius: 10px 10px 0px 0;" width="100%">
                  <p style="color:#FFFFFF; padding-left:20px;">Detalle:</p>
                </td>
              </tr>
              <tr style="background-color: #EEEEEE;">
                <td>
                  <table style="width:100%;padding: 20px 40px;">
                    <tbody>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8899.png"></td>
                        <td style="padding: 0px 10px 0px 10px; font-size:16px;">Fecha solicitada el:</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td style="padding-left: 10px;font-size:18px;">
                        `+ appointment.date_request +`
                        </td>
                      </tr>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8899.png"></td>
                        <td style="padding: 0px 10px 0px 10px; font-size:16px;">Fecha de la cita:</td>
                      </tr>
                      
                      <tr>
                        <td></td>
                        <td style="padding-left: 10px;font-size:18px;">
                        `+ appointment.date_appointment +`
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>  
            </table>
            <div style="background-color: #EEEEEE; color:#808080; font-size:14px; padding: 3px 55px; margin-top:5px;"><img
              src="https://crezcamos.com/wp-content/uploads/2021/12/tratamiento_email.png"
              style="padding-right: 5px;"> Adicional, <span style="color:#06C1A4;"> `+ student.name +` </span> ha aceptado
            los términos y condiciones legales. </div>
              <div class="content" style="padding: 0px;max-width: 600px;margin: 0;display: block;background-color: #FFFFFF;">
              <table style="width: 100%;">
                <tr >
                  <td class="contenido" style="margin: 0px;padding:0px;">                    
                    <!-- social & contact -->
                    <table class="social" width="100%" style="background-color: #FFFFFF !important;border-radius: 12px;text-align: center;padding-bottom: 18px;width: 100%;">
                      <tr >
                        <td colspan="8" >
                          <p style="margin-bottom: 0px;font-weight: normal;font-size: 17px;line-height: 1.6;color: #7F7F7F;">Nos vemos en:</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="8" >
                        <img src="https://crezcamos.com/wp-content/uploads/2022/03/redes.png" usemap="#image-map">
                        <map name="image-map">
                            <area target="_blank" alt="" title="" href="https://api.whatsapp.com/send?phone=573213891139&text=%C2%A1Hola!%20Quisiera%20recibir%20informaci%C3%B3n%20del%20programa%20de%20consejer%C3%ADa%20acad%C3%A9mica%20%F0%9F%98%81" coords="14,14,14" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.instagram.com/uis/" coords="55,15,15" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.youtube.com/user/uisvideo" coords="93,15,14" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.facebook.com/UISenLinea" coords="134,16,14" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.linkedin.com/school/universidad-industrial-de-santander/" coords="174,15,15" shape="circle">
                            <area target="_blank" alt="" title="" href="https://twitter.com/UIS" coords="214,16,13" shape="circle">
                            <area target="_blank" alt="" title="" href="https://open.spotify.com/album/4G2EFXjs6kRHPXg5eE0ndY" coords="253,15,14" shape="circle">
                        </map>
                        </td>
                      </tr>
                      
                    </table><!-- /social & contact -->
                    
                  </td>
                </tr>
              </table>
              </div><!-- /content -->
              <div style="border-top: 2px dashed #C2C2C2;">
                <table class="recomendaciones" style="background-color: #ffffff !important;padding: 0px 12px;">
                <tr >
                  <td width="25%" >
                    <img src="http://1.bp.blogspot.com/-uwr3B71stxM/TZVCbO7JHjI/AAAAAAAAAAQ/NpTB1iPRZkI/s220/escudo_uis.png" style="max-width: 100%; width: 100px; margin-top: 20px;">
                  </td>
                  <td style="padding: 0px 18px;">
                    <h5 class="titulo4" style="line-height: 1.1;margin-bottom: 15px;font-weight: 500;font-size: 17px;color: #46BC57;text-align: left;">Por tu seguridad ten presente</h5>
                    <p class="txt-security" style="margin-bottom: 0px;font-weight: normal;font-size: 10px;line-height: 1.6;color: #6e6e6e;">El programa de consejería académico nunca te solicitará datos que infrinjan la ley 1090 de 2006 de protección de datos personales como usuarios, claves, números de tarjetas de crédito, código de seguridad ni fechas de vencimiento, mediante vínculos de correo electrónico y mensajes de texto. Ten cuidado con esta información aun cuando el correo parezca ser enviado por profesionales del programa de consejería académica. Cualquier e-mail sospechoso que te pida diligenciar datos o contraseñas, por favor repórtalo a nuestros canales de atención al cliente y haz caso omiso a la solicitud.</p>
                  </td>
                </tr>
                <tr >
                  <td colspan="2" class="footer-bar" style="background-color: #FFFFFF;color: #46BC57;text-align: center;font-size: 10px;padding: 12px 6px 30px 6px;">
                    Todos los derechos reservados © 2022 | Proyecto de consejería académica - UIS 
                  </td>
                </tr>
              </table>
                </div>          
            </td>
            <td ></td>
          </tr><!-- /BODY -->
        
        
        </table></body>
        </html>
          
          
          `
      };

      await transporter.sendMail(
        mailOptions,
        await function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        },
      );
      return { message: 'Appointment created' };
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async myAppointmentsStudent(payload: { auth_token: string }) {
    try {
      if (!(await this.authStudent(payload.auth_token)))
        throw new UnauthorizedException();
      var decodedJwtAccessToken: any = this.jwtService.decode(
        payload.auth_token,
      );
      var student_id: number = decodedJwtAccessToken.id;
      const appointments = await prisma.medical_appointment.findMany({
        where: {
          student_id: student_id,
        },
        select: {
          id: true,
          psychology: {
            select: {
              name: true,
            },
          },
          date_request: true,
          date_appointment: true,
          status_appointment: true,
          psycho_diagnosis: true,
          student_rating: true,
          psycho_treatment: true,
        },
      });
      if (!appointments[0])
        return { message: 'No appointments found for this student' };
      return appointments;
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async myAppointmentsPsycho(payload: { auth_token: string }) {
    try {
      if (!(await this.authPsycho(payload.auth_token)))
        throw new UnauthorizedException();
      var decodedJwtAccessToken: any = this.jwtService.decode(
        payload.auth_token,
      );
      var psycho_id: number = decodedJwtAccessToken.id;
      const appointments = await prisma.medical_appointment.findMany({
        where: {
          psycho_id: psycho_id,
        },
        select: {
          id: true,
          student: {
            select: {
              name: true,
            },
          },
          date_request: true,
          date_appointment: true,
          status_appointment: true,
          psycho_diagnosis: true,
          student_rating: true,
          psycho_treatment: true,
        },
      });
      if (!appointments[0])
        return { message: 'No appointments found for this Psychologist' };
      return appointments;
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async cancelAppointment(cancelAppointmentDto: CancelAppointmentDto) {
    try {
      if (
        !(await this.authStudent(cancelAppointmentDto.auth_token)) &&
        !(await this.authPsycho(cancelAppointmentDto.auth_token)) &&
        !(await this.authSuperuser(cancelAppointmentDto.auth_token))
      )
        throw new UnauthorizedException();

      const appointment = await prisma.medical_appointment.findUnique({
        where: {
          id: cancelAppointmentDto.appointment_id,
        },
      });
      if (!appointment) return { message: 'Appointment not found' };
      const student = await prisma.student.findUnique({
        where: { id: appointment.student_id },
      });
      const psycho = await prisma.psychology.findUnique({
        where: { id: appointment.psycho_id },
      });
      var decodedJwtAccessToken: any = this.jwtService.decode(
        cancelAppointmentDto.auth_token,
      );
      var user_id: number = decodedJwtAccessToken.id;
      if (
        user_id != appointment.student_id &&
        user_id != appointment.psycho_id &&
        !(await this.authSuperuser(cancelAppointmentDto.auth_token))
      )
        throw new UnauthorizedException();
      if (appointment.status_appointment === 'canceled')
        return { message: 'Appointment already canceled' };
      if (appointment.status_appointment === 'finished')
        return { message: 'Appointment already finished' };
      if (appointment.status_appointment === 'active') {
        if (new Date() > new Date(appointment.date_appointment))
          return { message: 'Appointment already passed' };
        if (
          new Date(appointment.date_appointment).getTime() -
            new Date().getTime() <
          28800000
        )
          return {
            message: 'Appointment must canceled be at least 8 hours before',
          };
        const appointmentCanceled = await prisma.medical_appointment.update({
          where: { id: cancelAppointmentDto.appointment_id },
          data: {
            status_appointment: 'canceled',
          },
        });

        const nodemailer = require('nodemailer');

        var transporter = nodemailer.createTransport({
          host: 'smtp-mail.outlook.com', // hostname
          secureConnection: false, // TLS requires secureConnection to be false
          port: 587, // port for secure SMTP
          tls: {
            ciphers: 'SSLv3',
          },
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        var mailOptions = {
          from: process.env.EMAIL_USER.toString(),
          to: [student.email, psycho.email],
          subject: 'Appointment canceled',
          html: ` 
          
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" >
        <head >
        <!-- If you delete this meta tag, Half Life 3 will never be released. -->
        <meta name="viewport" content="width=device-width" >
        
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" >
        <title >Bienvenido al programa de Consejería Estudiantil</title>
          
        
        </head>
        
        <body  style="background-color:#E5E5E5 ; -webkit-font-smoothing: antialiased;-webkit-text-size-adjust: none;height: 100%;width: 100%!important;">
        
        
        <table class="head-wrap" style="width: 100%;">
          <tr >
          <td></td>
            <td class="header container" style="display: block!important;max-width: 600px!important;margin: 0 auto!important;clear: both!important;">
                <div class="content encabezado" style="padding: 15px 15px 0 0;max-width: 600px;margin: 0;display: block;background: transparent linear-gradient(180deg, #7BD1D1 0%, #06C1A4 100%) 0% 0% no-repeat padding-box;border-radius: 12px;">
                  <table style="width: 100%;">
                    <tr >
                      <td  class="logo-crz" style="text-align: top; padding-left: 20px;width:400px;">
                        <p class="titulo_encabezado" style="font-weight: 600;font-size: 36px;line-height: 39px;color: #FFFFFF;margin-left: 12px;margin-top: 0px; margin-bottom: 0px;">¡Hola!
                        <p  style="font-weight: 500;font-size: 18px;line-height: 23px;color: #FFFFFF; margin-left:12px;margin-top: 5px;">Vimos que tienes cancelaste una cita</p>
                        <p style="text-align: top; padding-left: 20px;"><img src="https://i.pinimg.com/originals/26/1d/79/261d79eba10658c0dfb9da61c5b28755.png" width="100"></p>
                        <p  style="font-weight: 400;font-size: 25px;line-height: 23px;color: #FFFFFF; margin-left: 12px;width:240px;">` + psycho.name + ` <br><span
                          style="font-weight: 400;font-size: 18px;line-height: 20px;color: #FFFFFF; margin-left: 0px;">
                          Canceló una cita </span></p>
                        </p>
                        
                        
                      </td>
                      <td style="width:200px;" >
                        <img src="https://petroleosvirtual.uis.edu.co/posgrados/wp-content/uploads/2020/09/logo2-blanco-1.png" width="200">
                      </td>
                    </tr>
                  </table>
                </div>
            </td>
            <td></td>
          </tr>
        
        <!-- BODY -->
          <tr >
            <td>
            </td>
            <td class="container" style="background-color: #ffffff ;display: block!important;max-width: 600px!important;margin: 0 auto!important;clear: both!important;">
          
        
        
            <table style="width: 100%; padding-left: 0px; padding-right: 0px; padding-top: 10px; color:#808080; font-size:18px;">
              <tr style="border-bottom: 1px solid #808080">
                <td width="100%" style="padding: 10px; text-align: center;">
                  <p style="text-align: center; color:#9490DA; font-weight: 500;">`+ student.name +`</p> 
                  <p style="padding: 0px 5%;">Ha cancelado una cita a través de nuestra página web <br><span
                    style="color:#06C1A4; margin: 0 auto;">consejería académica</span><br> 😊 Esperamos puedas ser contactado lo más pronto posible⏳</p>
                    <p style="padding: 0px 5%;">Te presentamos la información de la cita:</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #9490DA; border-radius: 10px 10px 0px 0;" width="100%">
                  <p style="color:#FFFFFF; padding-left:20px;">Sus datos:</p>
                </td>
              </tr>
              <tr style="background-color: #EEEEEE;">
                <td>
                  <table style="width:100%; padding: 20px 50px;">
                    <tbody>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8948.png"></td>
                        <td style="padding: 0px 10px 0px 10px;">Estudiante: <span style="color:#9490DA;">`+ student.name +`</span></td>
                      </tr>
                      <tr>
                        <td style="height: 10px;"></td>
                      </tr>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8948.png"></td>
                        <td style="padding: 0px 10px 0px 10px;">Psicólogo: <span style="color:#9490DA;">`+ psycho.name +`</span></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #06C1A4; border-radius: 10px 10px 0px 0;" width="100%">
                  <p style="color:#FFFFFF; padding-left:20px;">Detalle:</p>
                </td>
              </tr>
              <tr style="background-color: #EEEEEE;">
                <td>
                  <table style="width:100%;padding: 20px 40px;">
                    <tbody>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8899.png"></td>
                        <td style="padding: 0px 10px 0px 10px; font-size:16px;">Fecha cancelada el:</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td style="padding-left: 10px;font-size:18px;">
                        `+ new Date() +`
                        </td>
                      </tr>
                      <tr>
                        <td><img src="https://crezcamos.com/wp-content/uploads/2022/01/Grupo-8899.png"></td>
                        <td style="padding: 0px 10px 0px 10px; font-size:16px;">Fecha de la cita:</td>
                      </tr>
                      
                      <tr>
                        <td></td>
                        <td style="padding-left: 10px;font-size:18px;">
                        `+ appointment.date_appointment +`
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>  
            </table>
            <div style="background-color: #EEEEEE; color:#808080; font-size:14px; padding: 3px 55px; margin-top:5px;"><img
              src="https://crezcamos.com/wp-content/uploads/2021/12/tratamiento_email.png"
              style="padding-right: 5px;"> Adicional, <span style="color:#06C1A4;"> `+ student.name +` </span> ha aceptado
            los términos y condiciones legales. </div>
              <div class="content" style="padding: 0px;max-width: 600px;margin: 0;display: block;background-color: #FFFFFF;">
              <table style="width: 100%;">
                <tr >
                  <td class="contenido" style="margin: 0px;padding:0px;">                    
                    <!-- social & contact -->
                    <table class="social" width="100%" style="background-color: #FFFFFF !important;border-radius: 12px;text-align: center;padding-bottom: 18px;width: 100%;">
                      <tr >
                        <td colspan="8" >
                          <p style="margin-bottom: 0px;font-weight: normal;font-size: 17px;line-height: 1.6;color: #7F7F7F;">Nos vemos en:</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="8" >
                        <img src="https://crezcamos.com/wp-content/uploads/2022/03/redes.png" usemap="#image-map">
                        <map name="image-map">
                            <area target="_blank" alt="" title="" href="https://api.whatsapp.com/send?phone=573213891139&text=%C2%A1Hola!%20Quisiera%20recibir%20informaci%C3%B3n%20del%20programa%20de%20consejer%C3%ADa%20acad%C3%A9mica%20%F0%9F%98%81" coords="14,14,14" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.instagram.com/uis/" coords="55,15,15" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.youtube.com/user/uisvideo" coords="93,15,14" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.facebook.com/UISenLinea" coords="134,16,14" shape="circle">
                            <area target="_blank" alt="" title="" href="https://www.linkedin.com/school/universidad-industrial-de-santander/" coords="174,15,15" shape="circle">
                            <area target="_blank" alt="" title="" href="https://twitter.com/UIS" coords="214,16,13" shape="circle">
                            <area target="_blank" alt="" title="" href="https://open.spotify.com/album/4G2EFXjs6kRHPXg5eE0ndY" coords="253,15,14" shape="circle">
                        </map>
                        </td>
                      </tr>
                      
                    </table><!-- /social & contact -->
                    
                  </td>
                </tr>
              </table>
              </div><!-- /content -->
              <div style="border-top: 2px dashed #C2C2C2;">
                <table class="recomendaciones" style="background-color: #ffffff !important;padding: 0px 12px;">
                <tr >
                  <td width="25%" >
                    <img src="http://1.bp.blogspot.com/-uwr3B71stxM/TZVCbO7JHjI/AAAAAAAAAAQ/NpTB1iPRZkI/s220/escudo_uis.png" style="max-width: 100%; width: 100px; margin-top: 20px;">
                  </td>
                  <td style="padding: 0px 18px;">
                    <h5 class="titulo4" style="line-height: 1.1;margin-bottom: 15px;font-weight: 500;font-size: 17px;color: #46BC57;text-align: left;">Por tu seguridad ten presente</h5>
                    <p class="txt-security" style="margin-bottom: 0px;font-weight: normal;font-size: 10px;line-height: 1.6;color: #6e6e6e;">El programa de consejería académico nunca te solicitará datos que infrinjan la ley 1090 de 2006 de protección de datos personales como usuarios, claves, números de tarjetas de crédito, código de seguridad ni fechas de vencimiento, mediante vínculos de correo electrónico y mensajes de texto. Ten cuidado con esta información aun cuando el correo parezca ser enviado por profesionales del programa de consejería académica. Cualquier e-mail sospechoso que te pida diligenciar datos o contraseñas, por favor repórtalo a nuestros canales de atención al cliente y haz caso omiso a la solicitud.</p>
                  </td>
                </tr>
                <tr >
                  <td colspan="2" class="footer-bar" style="background-color: #FFFFFF;color: #46BC57;text-align: center;font-size: 10px;padding: 12px 6px 30px 6px;">
                    Todos los derechos reservados © 2022 | Proyecto de consejería académica - UIS 
                  </td>
                </tr>
              </table>
                </div>          
            </td>
            <td ></td>
          </tr><!-- /BODY -->
        
        
        </table></body>
        </html>
          
          
          `,
        };

        await transporter.sendMail(
          mailOptions,
          await function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          },
        );
        return { message: 'Appointment canceled' };
      }
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async finishAppointment(finishAppointmentDto: FinishAppointmentDto) {
    try {
      if (!(await this.authPsycho(finishAppointmentDto.auth_token)))
        throw new UnauthorizedException();
      const appointment = await prisma.medical_appointment.findUnique({
        where: {
          id: finishAppointmentDto.appointment_id,
        },
      });
      if (!appointment) return { message: 'Appointment not found' };
      var decodedJwtAccessToken: any = this.jwtService.decode(
        finishAppointmentDto.auth_token,
      );
      var psycho_id: number = decodedJwtAccessToken.id;
      if (psycho_id != appointment.psycho_id) throw new UnauthorizedException();
      if (appointment.status_appointment === 'canceled')
        return { message: 'Appointment already canceled' };
      if (appointment.status_appointment === 'finished')
        return { message: 'Appointment already finished' };
      if (appointment.status_appointment === 'active') {
        if (new Date() <= new Date(appointment.date_appointment))
          return { message: 'the appointment has not been made yet' };
        const appointmentFinished = await prisma.medical_appointment.update({
          where: { id: finishAppointmentDto.appointment_id },
          data: {
            status_appointment: 'finished',
            psycho_diagnosis: finishAppointmentDto.psycho_diagnosis,
            psycho_treatment: finishAppointmentDto.psycho_treatment,
          },
        });
        return { message: 'Appointment finished' };
      }
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async putAppointmentRating(putAppointmentRatingDto: PutAppointmentRatingDto) {
    try {
      if (!(await this.authStudent(putAppointmentRatingDto.auth_token)))
        throw new UnauthorizedException();
      const appointment = await prisma.medical_appointment.findUnique({
        where: {
          id: putAppointmentRatingDto.appointment_id,
        },
      });
      if (!appointment) return { message: 'Appointment not found' };
      var decodedJwtAccessToken: any = this.jwtService.decode(
        putAppointmentRatingDto.auth_token,
      );
      var student_id: number = decodedJwtAccessToken.id;
      if (student_id != appointment.student_id)
        throw new UnauthorizedException();
      if (appointment.status_appointment != 'finished')
        return { message: 'Appointment must be finished for put a rating' };
      if (appointment.student_rating > 0)
        return { message: 'Appointment already rated' };
      const appointmentRated = await prisma.medical_appointment.update({
        where: { id: putAppointmentRatingDto.appointment_id },
        data: {
          student_rating: putAppointmentRatingDto.student_rating,
        },
      });
      const thisPsychoAppointments = await prisma.medical_appointment.findMany({
        where: {
          psycho_id: appointment.psycho_id,
          status_appointment: 'finished',
        },
      });
      var psychoRating: number = 0;
      thisPsychoAppointments.forEach((element) => {
        psychoRating = psychoRating + element.student_rating;
      });
      const psycho = await prisma.psychology.findUnique({
        where: { id: appointment.psycho_id },
      });
      psychoRating = psychoRating / (psycho.appointments_number + 1);
      await prisma.psychology.update({
        where: { id: appointment.psycho_id },
        data: {
          rating_average: psychoRating,
          appointments_number: psycho.appointments_number + 1,
        },
      });

      return { message: 'Appointment rated' };
    } catch (error) {
      return { message: 'Failed ' + error };
    }
  }

  async authStudent(auth_token: string): Promise<boolean> {
    try {
      const decodedJwtAccessToken: any = this.jwtService.decode(auth_token);
      const now: any = new Date().getTime() / 1000;
      const search = await prisma.student.findMany({
        where: {
          id: decodedJwtAccessToken.id,
          nickname: decodedJwtAccessToken.nickname,
        },
      });
      if (
        !decodedJwtAccessToken ||
        !search[0] ||
        now > decodedJwtAccessToken.exp
      )
        return false;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async authPsycho(auth_token: string): Promise<boolean> {
    try {
      const decodedJwtAccessToken: any = this.jwtService.decode(auth_token);
      const now: any = new Date().getTime() / 1000;
      const search = await prisma.psychology.findMany({
        where: {
          id: decodedJwtAccessToken.id,
          nickname: decodedJwtAccessToken.nickname,
        },
      });
      if (
        !decodedJwtAccessToken ||
        !search[0] ||
        now > decodedJwtAccessToken.exp
      )
        return false;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async authSuperuser(auth_token: string): Promise<boolean> {
    try {
      const decodedJwtAccessToken: any = this.jwtService.decode(auth_token);
      const now: any = new Date().getTime() / 1000;
      const search = await prisma.superuser.findMany({
        where: {
          id: decodedJwtAccessToken.id,
          nickname: decodedJwtAccessToken.nickname,
        },
      });
      if (
        !decodedJwtAccessToken ||
        !search[0] ||
        now > decodedJwtAccessToken.exp
      )
        return false;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}

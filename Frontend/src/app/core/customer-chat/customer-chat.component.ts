import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ChatThread } from '../../models/chat';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customer-chat',
  imports: [NgFor, FormsModule, NgIf, DatePipe, CommonModule],
  templateUrl: './customer-chat.component.html',
  styleUrl: './customer-chat.component.css'
})
export class CustomerChatComponent implements OnInit, OnDestroy{
  subject = '';
  threadId: string ="";
  userId = 'anonymous';
  messages: any[] = [];
  newMessage = '';
  private jwtHelper = new JwtHelperService();
  threads: any[] = [];
  selectedThread: any = null;
  customerThreads: ChatThread[] | [] = [];
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  aiTyping = false;

  constructor(private chatService: ChatService, private cd: ChangeDetectorRef) {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = this.jwtHelper.decodeToken(token);
      if (decoded.nameid) {
        this.userId = decoded.nameid;
      }
    } else {
      //console.warn('Token non trovato nel localStorage');
    }
  }

  ngOnInit() {
    const cached = this.chatService.getCurrentCustomerThreads();

    if(!cached || cached.length === 0){
      this.chatService.getCustomerThreads()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (chatThreads:ChatThread[])=>{
            this.chatService.setCustomerThreads(chatThreads);
          },
          error: (err) => {
            //console.error('Errore nel recupero dei threads:', err);
          }
        })
    }

    this.chatService.threadCustomerList$
      .pipe(takeUntil(this.destroy$))
      .subscribe(threads=>{
        this.customerThreads = threads
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  return(){
    this.selectedThread = null;
  }

  openThread(thread: ChatThread) {
    this.chatService.disconnect().then(() => {
      this.selectedThread = thread;
      this.threadId = thread.id;
      this.messages = [];

      this.chatService.loadHistory(this.threadId).subscribe(data => {
        this.messages = data.reverse();
        this.cd.detectChanges();
      });

      this.chatService.connect(this.threadId).then(() => {
        this.chatService.onReceiveMessage((sender, msg, time) => {
          if (sender === 'CHATBOT' || sender === 'Admin') {
            this.aiTyping = false;
          }
          if (msg.includes("sul pulsante")) {
            this.messages.unshift({ senderId: sender, message: msg, timestamp: time, showOperatorButton: true });
          }else{
            this.messages.unshift({ senderId: sender, message: msg, timestamp: time });
          }

          this.cd.detectChanges();
        });
      });

      this.chatService.onThreadClosed((threadId) => {
        if (this.threadId === threadId) {
          Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'La conversazione è stata chiusa da un amministratore.',
            confirmButtonText: 'Ok',
            confirmButtonColor: '#d33',
            allowOutsideClick: false,
            allowEscapeKey: true
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload(); 
            }
          });
        }
      });

    });
  }

  createThread() {
    if (!this.subject.trim()) return;
    this.chatService.createThread(this.userId, this.subject).subscribe(thread => {
      this.threadId = thread.id;
      this.messages = [];
      if (this.threadId) {
        this.chatService.addThreadToState(thread);
        this.openThread(thread);
      }
      this.subject = ""; 
    });
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedThread) {
      if (this.selectedThread.isAi) {
        this.aiTyping = true;
        this.cd.detectChanges();
      }
      this.chatService.sendMessage(this.selectedThread.id, this.userId, this.newMessage);
      this.newMessage = '';
    }
  }

  richiediOperatore(thread: ChatThread){
    this.chatService.chatAdmin(thread.id).subscribe(data =>{
      //console.log(data);
    });
    this.messages.unshift({ senderId: 'CHATBOT', message: 'Attendi la risposta di un amministratore', timestamp: new Date().toISOString()});
  }
}

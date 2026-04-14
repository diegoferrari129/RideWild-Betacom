import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatThread } from '../../models/chat';
import { Subject, takeUntil } from 'rxjs';
import { GoBackButtonComponent } from "../../shared/buttons/go-back-button/go-back-button.component";
@Component({
  selector: 'app-admin-chat',
  imports: [NgFor, FormsModule, NgIf, DatePipe, CommonModule, GoBackButtonComponent],
  templateUrl: './admin-chat.component.html',
  styleUrl: './admin-chat.component.css'
})
export class AdminChatComponent implements OnInit, OnDestroy {
  threads: any[] = [];
  selectedThread: any = null;
  messages: any[] = [];
  newMessage = '';
  adminId = 'Admin';
  threadId = '';
  adminThreads: ChatThread[] | [] = [];
  private destroy$ = new Subject<void>();
  showOnlyOpenThreads = false;

  get filteredThreads() {
  return this.showOnlyOpenThreads
    ? this.adminThreads.filter(t => t.isOpened)
    : this.adminThreads;
  }


  constructor(private chatService: ChatService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
      const cached = this.chatService.getCurrentAllThreads();
  
      if(!cached || cached.length === 0){
        this.chatService.getAllThreads()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (chatThreads:ChatThread[])=>{
              this.chatService.setAdminThreads(chatThreads);
            },
            error: (err) => {
              //console.error('Errore nel recupero dei threads:', err);
            }
          })
      }
  
      this.chatService.threadAdminList$
        .pipe(takeUntil(this.destroy$))
        .subscribe(threads=>{
          this.adminThreads = threads
        });
    }
  
    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

  return(){
    this.selectedThread = null;
  }

  openThread(thread: any) {
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
          this.messages.unshift({ senderId: sender, message: msg, timestamp: time });
          this.cd.detectChanges();
        });
      });
    });
  }

  closeThread(id: string){
    this.chatService.closeThread(id).subscribe(data =>{
      this.chatService.UpdateThreadToState(data);
      //console.log("Top");
    });
    this.return();
  }

  resetChat(){
    window.location.reload();
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedThread) {
      this.chatService.sendMessage(this.selectedThread.id, this.adminId, this.newMessage);
      this.newMessage = '';
    }
  }
}
import type { BloodReservation, CreateReservationInput } from '../types/reservation';
import { bloodBankService } from './bloodBankService';
import { bloodRequestRepository } from './bloodRequestRepository';
import { transactionService } from './transactionService';

const STORAGE_KEY = 'raktsetu_blood_reservations_v2';

export class ReservationService {
  private getStoredReservations(): BloodReservation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading reservations from storage', e);
    }
    return [];
  }

  private saveReservations(res: BloodReservation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
      window.dispatchEvent(new Event('raktsetu_reservation_updated'));
    } catch (e) {
      console.error('Failed saving reservations to storage', e);
    }
  }

  async getReservations(): Promise<BloodReservation[]> {
    return this.getStoredReservations();
  }

  async getReservation(id: string): Promise<BloodReservation | null> {
    const all = this.getStoredReservations();
    return all.find((r) => r.id === id || r.reservationId.toLowerCase() === id.toLowerCase()) || null;
  }

  async getReservationByRequestId(requestId: string): Promise<BloodReservation | null> {
    const all = this.getStoredReservations();
    return all.find((r) => r.requestId === requestId && (r.status === 'ACTIVE' || r.status === 'PENDING')) || null;
  }

  /**
   * Step 20: Atomically Lock Blood at Blood Bank & Create Reservation
   */
  async createReservation(input: CreateReservationInput): Promise<BloodReservation> {
    // 1. Atomic Bank Reservation
    await bloodBankService.reserveStockAtBank(
      input.bloodBankId,
      input.bloodGroup,
      input.quantityLitres
    );

    const now = new Date();
    const durationHours = input.durationHours || 4;
    const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();
    const resId = `RES-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes: BloodReservation = {
      id: `res-${Date.now()}`,
      reservationId: resId,
      requestId: input.requestId,
      bloodBankId: input.bloodBankId,
      bloodBankName: input.bloodBankName,
      hospitalId: 'HSP-00124',
      hospitalName: 'XYZ Hospital',
      bloodGroup: input.bloodGroup,
      quantityLitres: input.quantityLitres,
      status: 'ACTIVE',
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: input.createdBy || 'Network Load Balancer',
      notes: input.notes,
    };

    const all = this.getStoredReservations();
    all.unshift(newRes);
    this.saveReservations(all);

    // 2. Update Request Status to 'reserved'
    await bloodRequestRepository.updateRequest(input.requestId, {
      status: 'reserved',
      matchedBloodBankId: input.bloodBankId,
      matchedBloodBankName: input.bloodBankName,
      matchedQuantity: input.quantityLitres,
      reservationId: resId,
    });

    return newRes;
  }

  /**
   * Step 20: Blood Dispatch from Bank -> Transit
   */
  async dispatchReservation(reservationId: string): Promise<BloodReservation> {
    const all = this.getStoredReservations();
    const res = all.find((r) => r.id === reservationId || r.reservationId === reservationId);

    if (!res) {
      throw new Error(`Reservation ${reservationId} not found.`);
    }

    res.transferDispatchedAt = new Date().toISOString();
    res.updatedAt = new Date().toISOString();
    this.saveReservations(all);

    await bloodRequestRepository.updateRequest(res.requestId, {
      status: 'in_transit',
    });

    return res;
  }

  /**
   * Step 20: Blood Received at Hospital -> Immutable TRANSFERRED_IN Transaction & Inventory Increase!
   */
  async confirmReceipt(
    reservationId: string,
    verifiedBy: string = 'Staff Nurse'
  ): Promise<{ reservation: BloodReservation; transactionId: string }> {
    const all = this.getStoredReservations();
    const res = all.find((r) => r.id === reservationId || r.reservationId === reservationId);

    if (!res) {
      throw new Error(`Reservation ${reservationId} not found.`);
    }

    if (res.status === 'FULFILLED') {
      throw new Error('This reservation has already been received and fulfilled.');
    }

    // 1. Mark reservation fulfilled
    res.status = 'FULFILLED';
    res.transferReceivedAt = new Date().toISOString();
    res.updatedAt = new Date().toISOString();
    this.saveReservations(all);

    // 2. Fulfill bank stock permanently
    await bloodBankService.fulfillOrReleaseBankStock(
      res.bloodBankId,
      res.bloodGroup,
      res.quantityLitres,
      'fulfill'
    );

    // 3. Atomically Record Receipt Transaction in Hospital Ledger
    const txn = await transactionService.recordReceipt(
      res.bloodGroup,
      res.quantityLitres,
      res.requestId,
      res.bloodBankName,
      verifiedBy
    );

    // 4. Update request status to completed
    await bloodRequestRepository.updateRequest(res.requestId, {
      status: 'completed',
    });

    return { reservation: res, transactionId: txn.transactionId };
  }
}

export const reservationService = new ReservationService();

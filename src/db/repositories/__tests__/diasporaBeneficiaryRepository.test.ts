import { createFakeDatabase } from '../../testUtils/createFakeDatabase';
import { NotFoundError } from '../errors';
import {
  createDiasporaBeneficiary,
  deleteDiasporaBeneficiary,
  getDiasporaBeneficiaryById,
  listDiasporaBeneficiaries,
  updateDiasporaBeneficiary,
} from '../diasporaBeneficiaryRepository';
import { createDiasporaTransfer, listDiasporaTransfers } from '../diasporaTransferRepository';

describe('diasporaBeneficiaryRepository', () => {
  it('creates a monthly beneficiary and reads it back', async () => {
    const { db } = createFakeDatabase();

    const beneficiary = await createDiasporaBeneficiary(db, {
      name: 'Fatima Benali',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });

    expect(beneficiary.id).toEqual(expect.any(String));
    expect(beneficiary.usualAmountMinor).toBe(30000);
    expect(await getDiasporaBeneficiaryById(db, beneficiary.id)).toEqual(beneficiary);
  });

  it('creates an occasional beneficiary with no usual amount', async () => {
    const { db } = createFakeDatabase();

    const beneficiary = await createDiasporaBeneficiary(db, {
      name: 'Karim Benali',
      relationship: 'Frère',
      usualAmountMinor: null,
      frequency: 'occasional',
    });

    expect(beneficiary.usualAmountMinor).toBeNull();
    expect(beneficiary.frequency).toBe('occasional');
  });

  it('returns null for an unknown id', async () => {
    const { db } = createFakeDatabase();
    expect(await getDiasporaBeneficiaryById(db, 'missing')).toBeNull();
  });

  it('lists beneficiaries ordered by creation', async () => {
    const { db } = createFakeDatabase();
    const first = await createDiasporaBeneficiary(db, {
      name: 'Fatima',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    const second = await createDiasporaBeneficiary(db, {
      name: 'Karim',
      relationship: 'Frère',
      usualAmountMinor: null,
      frequency: 'occasional',
    });

    const beneficiaries = await listDiasporaBeneficiaries(db);
    expect(beneficiaries.map((b) => b.id)).toEqual([first.id, second.id]);
  });

  it('updates a beneficiary and bumps updatedAt', async () => {
    const { db } = createFakeDatabase();
    const beneficiary = await createDiasporaBeneficiary(db, {
      name: 'Fatima',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });

    const updated = await updateDiasporaBeneficiary(db, beneficiary.id, {
      usualAmountMinor: 35000,
    });

    expect(updated.usualAmountMinor).toBe(35000);
    expect(updated.name).toBe('Fatima');
    expect(await getDiasporaBeneficiaryById(db, beneficiary.id)).toEqual(updated);
  });

  it('throws NotFoundError when updating an unknown beneficiary', async () => {
    const { db } = createFakeDatabase();
    await expect(
      updateDiasporaBeneficiary(db, 'missing', { name: 'X' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes a beneficiary', async () => {
    const { db } = createFakeDatabase();
    const beneficiary = await createDiasporaBeneficiary(db, {
      name: 'Fatima',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });

    await deleteDiasporaBeneficiary(db, beneficiary.id);

    expect(await getDiasporaBeneficiaryById(db, beneficiary.id)).toBeNull();
  });

  it('throws NotFoundError when deleting an unknown beneficiary', async () => {
    const { db } = createFakeDatabase();
    await expect(deleteDiasporaBeneficiary(db, 'missing')).rejects.toThrow(NotFoundError);
  });

  it('deleting a beneficiary keeps past transfers intact (sans perdre l\'historique)', async () => {
    const { db } = createFakeDatabase();
    const beneficiary = await createDiasporaBeneficiary(db, {
      name: 'Fatima',
      relationship: 'Mère',
      usualAmountMinor: 30000,
      frequency: 'monthly',
    });
    const transfer = await createDiasporaTransfer(db, {
      amountMinor: 30000,
      currencyCode: 'EUR',
      occurredAt: '2026-03-15T10:00:00.000Z',
      beneficiaryId: beneficiary.id,
    });

    await deleteDiasporaBeneficiary(db, beneficiary.id);

    const transfers = await listDiasporaTransfers(db);
    expect(transfers).toEqual([transfer]);
  });
});

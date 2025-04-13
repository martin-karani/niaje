import { queryClient, trpc, type RouterInputs } from "@/utils/trpc";

// Utility hook for payment-related queries
export const usePayments = () => {
  // Get all transactions with optional filters
  const getAllTransactions = (
    filters?: RouterInputs["payments"]["getAllTransactions"]
  ) => {
    return trpc.payments.getAllTransactions.useQuery(filters || {}, {
      // Don't auto-retry on error
      retry: 0,
      onError: (error) => {
        console.error("Error fetching transactions:", error);
      },
    });
  };

  // Get transaction by ID
  const getTransactionById = (transactionId: string) => {
    return trpc.payments.getTransactionById.useQuery({ id: transactionId });
  };

  // Create transaction mutation
  const createTransaction = trpc.payments.createTransaction.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllTransactions"]],
      });
    },
  });

  // Record rent payment mutation (simplified transaction creation)
  const recordRentPayment = trpc.payments.recordRentPayment.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllTransactions"]],
      });
    },
  });

  // Update transaction mutation
  const updateTransaction = trpc.payments.updateTransaction.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllTransactions"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["payments", "getTransactionById"], { id: data.id }],
      });
    },
  });

  // Delete transaction mutation
  const deleteTransaction = trpc.payments.deleteTransaction.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllTransactions"]],
      });
    },
  });

  // Get all utility bills with optional filters
  const getAllUtilityBills = (
    filters?: RouterInputs["payments"]["getAllUtilityBills"]
  ) => {
    return trpc.payments.getAllUtilityBills.useQuery(filters || {});
  };

  // Get utility bill by ID
  const getUtilityBillById = (billId: string) => {
    return trpc.payments.getUtilityBillById.useQuery({ id: billId });
  };

  // Create utility bill mutation
  const createUtilityBill = trpc.payments.createUtilityBill.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllUtilityBills"]],
      });
    },
  });

  // Update utility bill mutation
  const updateUtilityBill = trpc.payments.updateUtilityBill.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllUtilityBills"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["payments", "getUtilityBillById"], { id: data.id }],
      });
    },
  });

  // Mark utility bill as paid mutation
  const markUtilityBillPaid = trpc.payments.markUtilityBillPaid.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllUtilityBills"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["payments", "getUtilityBillById"], { id: data.bill.id }],
      });
      // Also invalidate transactions since a new one is created
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllTransactions"]],
      });
    },
  });

  // Delete utility bill mutation
  const deleteUtilityBill = trpc.payments.deleteUtilityBill.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["payments", "getAllUtilityBills"]],
      });
    },
  });

  // Generate financial report
  const generateFinancialReport =
    trpc.payments.generateFinancialReport.useMutation();

  return {
    transactions: {
      getAll: getAllTransactions,
      getById: getTransactionById,
      create: createTransaction,
      update: updateTransaction,
      delete: deleteTransaction,
      recordRentPayment,
    },
    utilityBills: {
      getAll: getAllUtilityBills,
      getById: getUtilityBillById,
      create: createUtilityBill,
      update: updateUtilityBill,
      markAsPaid: markUtilityBillPaid,
      delete: deleteUtilityBill,
    },
    reports: {
      generateFinancial: generateFinancialReport,
    },
  };
};

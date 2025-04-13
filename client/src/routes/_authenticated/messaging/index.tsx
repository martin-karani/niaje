import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessaging } from "@/hooks/use-messages";
import { useTenants } from "@/hooks/use-tenants";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  ArrowRight,
  AtSign,
  Check,
  CheckCircle,
  Filter,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/messaging/")({
  component: Messaging,
});

function Messaging() {
  const { user, activeProperty } = useAuth();
  const [activeTab, setActiveTab] = useState("compose");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageType, setMessageType] = useState<"sms" | "email">("sms");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Use our hooks
  const { getAll: getAllTenants } = useTenants();
  const { sendMessage, getMessages, deleteMessage } = useMessaging();

  // Fetch tenants for the active property
  const {
    data: tenantsData,
    isLoading: isLoadingTenants,
    error: tenantsError,
  } = getAllTenants({
    propertyId: activeProperty?.id,
  });

  // Fetch message history
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = getMessages({
    propertyId: activeProperty?.id,
  });

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText || selectedTenants.length === 0) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage.mutateAsync({
        tenantIds: selectedTenants,
        messageType,
        messageText,
        subject: messageType === "email" ? messageSubject : undefined,
        propertyId: activeProperty?.id,
      });

      // Reset form after sending
      setMessageText("");
      setMessageSubject("");
      setSelectedTenants([]);

      // Switch to history tab to see the sent message
      setActiveTab("history");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle selecting a tenant
  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  // Handle selecting all tenants
  const handleSelectAllTenants = () => {
    if (!tenantsData) return;

    const allTenantIds = tenantsData.map((tenant) => tenant.id);
    if (selectedTenants.length === allTenantIds.length) {
      // If all are selected, deselect all
      setSelectedTenants([]);
    } else {
      // Otherwise, select all
      setSelectedTenants(allTenantIds);
    }
  };

  // Filter tenants based on search term
  const filteredTenants = tenantsData
    ? tenantsData.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Loading state
  if (isLoadingTenants) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (tenantsError) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="text-destructive text-lg mb-2">
          Error loading tenants
        </div>
        <p className="text-muted-foreground">{tenantsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Messaging</h1>
        <Button onClick={() => setActiveTab("compose")}>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Tenant Selection Panel */}
            <div className="w-full md:w-1/3 border rounded-lg p-4 space-y-4">
              <div className="font-medium text-lg flex justify-between items-center">
                <h2>Select Recipients</h2>
                <div className="text-sm text-muted-foreground">
                  {selectedTenants.length} selected
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  className="w-full py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllTenants}
                >
                  {selectedTenants.length === (tenantsData?.length || 0)
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

              <div className="border rounded-md h-[400px] overflow-y-auto">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className={`flex items-center p-3 border-b cursor-pointer hover:bg-muted/40 transition-colors ${
                        selectedTenants.includes(tenant.id) ? "bg-muted/40" : ""
                      }`}
                      onClick={() => handleSelectTenant(tenant.id)}
                    >
                      <div className="mr-3">
                        {selectedTenants.includes(tenant.id) ? (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-muted-foreground"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{tenant.name}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <AtSign className="h-3 w-3 mr-1" />
                            {tenant.email}
                          </div>
                          {tenant.phone && (
                            <div>
                              <MessageCircle className="h-3 w-3 mr-1 inline" />
                              {tenant.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No tenants match your search"
                        : "No tenants available"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Message Composition Panel */}
            <div className="w-full md:w-2/3 border rounded-lg p-4 space-y-4">
              <div className="font-medium text-lg">
                <h2>Compose Message</h2>
              </div>

              <div className="flex gap-4 mb-4">
                <Button
                  variant={messageType === "sms" ? "default" : "outline"}
                  onClick={() => setMessageType("sms")}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  SMS
                </Button>
                <Button
                  variant={messageType === "email" ? "default" : "outline"}
                  onClick={() => setMessageType("email")}
                  className="flex items-center gap-2"
                >
                  <AtSign className="h-4 w-4" />
                  Email
                </Button>
              </div>

              {messageType === "email" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Write your ${messageType} message here...`}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[200px]"
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {messageType === "sms" ? (
                    <span>
                      {messageText.length}/160 characters
                      {messageText.length > 160 &&
                        " (multiple SMS will be sent)"}
                    </span>
                  ) : (
                    <span>
                      {selectedTenants.length} recipient
                      {selectedTenants.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMessageText("");
                      setMessageSubject("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      isSending ||
                      selectedTenants.length === 0 ||
                      !messageText ||
                      (messageType === "email" && !messageSubject)
                    }
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send {messageType.toUpperCase()}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Message History</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="md" />
            </div>
          ) : messagesError ? (
            <div className="text-center py-12 border rounded-lg">
              <div className="text-destructive text-lg mb-2">
                Error loading messages
              </div>
              <p className="text-muted-foreground">{messagesError.message}</p>
            </div>
          ) : messagesData && messagesData.messages.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {messagesData.messages.map((message) => (
                <div key={message.id} className="p-4 hover:bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded ${
                          message.type === "sms"
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {message.type === "sms" ? (
                          <MessageCircle className="h-4 w-4" />
                        ) : (
                          <AtSign className="h-4 w-4" />
                        )}
                      </div>
                      <h3 className="font-medium">
                        {message.type === "email"
                          ? message.subject || "No Subject"
                          : `SMS to ${message.recipients.length} recipient${
                              message.recipients.length !== 1 ? "s" : ""
                            }`}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mb-3 line-clamp-2">{message.content}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">
                        Sent to:
                      </span>
                      <div className="flex">
                        {message.recipients
                          .slice(0, 3)
                          .map((recipient, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full bg-primary/10 -ml-1 first:ml-0 flex items-center justify-center text-xs"
                            >
                              {recipient.tenant?.name.charAt(0)}
                            </div>
                          ))}
                        {message.recipients.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted -ml-1 flex items-center justify-center text-xs">
                            +{message.recipients.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        onClick={() => deleteMessage.mutate({ id: message.id })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No messages yet</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Send your first message to tenants
              </p>
              <Button onClick={() => setActiveTab("compose")}>
                <Plus className="h-4 w-4 mr-2" />
                Compose Message
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Message Templates</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Template Cards */}
            <TemplateCard
              title="Rent Reminder"
              content="Dear [Tenant], this is a friendly reminder that your rent payment of [Amount] is due on [Date]. Please ensure timely payment to avoid late fees."
              type="sms"
            />

            <TemplateCard
              title="Maintenance Visit"
              content="Dear [Tenant], we have scheduled a maintenance visit for your unit on [Date] at [Time]. Please let us know if this time works for you."
              type="email"
              subject="Scheduled Maintenance Visit"
            />

            <TemplateCard
              title="Welcome Message"
              content="Welcome [Tenant]! We're happy to have you as a resident at [Property]. If you need any assistance, please contact us at [Contact]."
              type="sms"
            />

            <TemplateCard
              title="Lease Renewal"
              content="Dear [Tenant], your lease at [Property] is coming up for renewal on [Date]. We'd like to discuss your renewal options. Please contact us at your earliest convenience."
              type="email"
              subject="Your Lease Renewal Information"
            />

            <TemplateCard
              title="Holiday Notice"
              content="Dear [Tenant], please note that our office will be closed on [Date] for the holiday. For emergencies, please call [Emergency Contact]."
              type="sms"
            />

            <div className="border border-dashed rounded-lg p-6 flex items-center justify-center">
              <Button
                variant="ghost"
                className="flex flex-col items-center h-auto py-6"
              >
                <Plus className="h-8 w-8 mb-2" />
                <span>Add New Template</span>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Template Card Component
function TemplateCard({
  title,
  content,
  type,
  subject,
}: {
  title: string;
  content: string;
  type: "sms" | "email";
  subject?: string;
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium">{title}</h3>
        <div
          className={`px-2 py-1 rounded text-xs ${
            type === "sms"
              ? "bg-cyan-100 text-cyan-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {type.toUpperCase()}
        </div>
      </div>

      {type === "email" && subject && (
        <div className="text-sm font-medium mb-2 text-muted-foreground">
          Subject: {subject}
        </div>
      )}

      <p className="text-sm mb-4 text-muted-foreground line-clamp-3">
        {content}
      </p>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button size="sm" className="flex items-center gap-1">
          Use <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

export default Messaging;

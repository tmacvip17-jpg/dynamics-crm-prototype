import { useState } from "react";
import Layout from "./components/Layout";
import OpportunityList from "./components/OpportunityList";
import OpportunityDetail from "./components/OpportunityDetail";
import AccountList from "./components/AccountList";
import AccountDetail from "./components/AccountDetail";
import ContactList from "./components/ContactList";
import ContactDetail from "./components/ContactDetail";
import LeadList from "./components/LeadList";
import LeadDetail from "./components/LeadDetail";
import CompetitorList from "./components/CompetitorList";
import CompetitorDetail from "./components/CompetitorDetail";
import ActivityList from "./components/ActivityList";
import ActivityDetail from "./components/ActivityDetail";
import ProjectApplicationList from "./components/ProjectApplicationList";
import ProjectApplicationDetail from "./components/ProjectApplicationDetail";
import OEMList from "./components/OEMList";
import OEMDetail from "./components/OEMDetail";
import OESList from "./components/OESList";
import OESDetail from "./components/OESDetail";
import ProjectVehicleModelList from "./components/ProjectVehicleModelList";
import ProjectVehicleModelDetail from "./components/ProjectVehicleModelDetail";
import Dashboards from "./components/Dashboards";
import AITopicParser from "./components/AITopicParser";

export default function App() {
  const [currentView, setCurrentView] = useState("opportunities");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const navigateToDetail = (view: string, id?: string) => {
    setSelectedId(id || null);
    setCurrentView(view);
  };

  const navigateToList = (view: string) => {
    setSelectedId(null);
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboards":
        return <Dashboards onNavigate={navigateToList} />;

      case "ai-topic-parser":
        return <AITopicParser />;

      case "activities":
        return (
          <ActivityList
            onSelect={(id) => navigateToDetail("activity-detail", id)}
            onNew={() => navigateToDetail("activity-detail")}
          />
        );
      case "activity-detail":
        return (
          <ActivityDetail
            id={selectedId}
            onSave={() => navigateToList("activities")}
            onBack={() => navigateToList("activities")}
          />
        );
      case "project-applications":
        return (
          <ProjectApplicationList
            onSelect={(id) => navigateToDetail("project-application-detail", id)}
            onNew={() => navigateToDetail("project-application-detail")}
          />
        );
      case "project-application-detail":
        return (
          <ProjectApplicationDetail
            id={selectedId}
            onSave={() => navigateToList("project-applications")}
            onBack={() => navigateToList("project-applications")}
          />
        );
      case "oems":
        return (
          <OEMList
            onSelect={(id) => navigateToDetail("oem-detail", id)}
            onNew={() => navigateToDetail("oem-detail")}
          />
        );
      case "oem-detail":
        return (
          <OEMDetail
            id={selectedId}
            onSave={() => navigateToList("oems")}
            onBack={() => navigateToList("oems")}
          />
        );
      case "oes":
        return (
          <OESList
            onSelect={(id) => navigateToDetail("oes-detail", id)}
            onNew={() => navigateToDetail("oes-detail")}
          />
        );
      case "oes-detail":
        return (
          <OESDetail
            id={selectedId}
            onSave={() => navigateToList("oes")}
            onBack={() => navigateToList("oes")}
          />
        );
      case "vehicle-models":
        return (
          <ProjectVehicleModelList
            onSelect={(id) => navigateToDetail("vehicle-model-detail", id)}
            onNew={() => navigateToDetail("vehicle-model-detail")}
          />
        );
      case "vehicle-model-detail":
        return (
          <ProjectVehicleModelDetail
            id={selectedId}
            onSave={() => navigateToList("vehicle-models")}
            onBack={() => navigateToList("vehicle-models")}
          />
        );

      case "opportunities":
        return (
          <OpportunityList
            onSelect={(id) => navigateToDetail("opportunity-detail", id)}
            onNew={() => navigateToDetail("opportunity-detail")}
          />
        );
      case "opportunity-detail":
        return (
          <OpportunityDetail
            id={selectedId}
            onSave={() => navigateToList("opportunities")}
            onBack={() => navigateToList("opportunities")}
          />
        );

      case "accounts":
        return (
          <AccountList
            onSelect={(id) => navigateToDetail("account-detail", id)}
            onNew={() => navigateToDetail("account-detail")}
          />
        );
      case "account-detail":
        return (
          <AccountDetail
            id={selectedId}
            onSave={() => navigateToList("accounts")}
            onBack={() => navigateToList("accounts")}
          />
        );

      case "contacts":
        return (
          <ContactList
            onSelect={(id) => navigateToDetail("contact-detail", id)}
            onNew={() => navigateToDetail("contact-detail")}
          />
        );
      case "contact-detail":
        return (
          <ContactDetail
            id={selectedId}
            onSave={() => navigateToList("contacts")}
            onBack={() => navigateToList("contacts")}
          />
        );

      case "leads":
        return (
          <LeadList
            onSelect={(id) => navigateToDetail("lead-detail", id)}
            onNew={() => navigateToDetail("lead-detail")}
          />
        );
      case "lead-detail":
        return (
          <LeadDetail
            id={selectedId}
            onSave={() => navigateToList("leads")}
            onBack={() => navigateToList("leads")}
          />
        );

      case "competitors":
        return (
          <CompetitorList
            onSelect={(id) => navigateToDetail("competitor-detail", id)}
            onNew={() => navigateToDetail("competitor-detail")}
          />
        );
      case "competitor-detail":
        return (
          <CompetitorDetail
            id={selectedId}
            onSave={() => navigateToList("competitors")}
            onBack={() => navigateToList("competitors")}
          />
        );

      default:
        return (
          <OpportunityList
            onSelect={(id) => navigateToDetail("opportunity-detail", id)}
            onNew={() => navigateToDetail("opportunity-detail")}
          />
        );
    }
  };

  return (
    <Layout
      currentView={currentView}
      onNavigate={(view) => navigateToList(view)}
    >
      {renderContent()}
    </Layout>
  );
}

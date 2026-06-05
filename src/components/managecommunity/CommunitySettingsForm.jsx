import { Save } from "lucide-react";
import { useState } from "react";

import ProfileImageUpload from "@/components/editprofile/ProfileImageUpload";
import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";

const visibilityOptions = [
    {
        value: "public",
        label: "Public",
    },
    {
        value: "private",
        label: "Private",
    },
];

export default function CommunitySettingsForm({ community, onSave }) {
    const [formData, setFormData] = useState({
        image: community.image,
        name: community.name,
        category: community.category,
        visibility: community.visibility,
        description: community.description,
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSave(formData);
    }

    return (
        <section className="content-card-padded">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <ProfileImageUpload
                    variant="cover"
                    imageSrc={formData.image}
                    originalImageSrc={community.image}
                    onImageChange={(imageUrl) =>
                        setFormData((currentData) => ({
                            ...currentData,
                            image: imageUrl,
                        }))
                    }
                    alt={`${community.name} cover`}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-name" className="type-body-sm text-(--primary)">
                            Community Name
                        </label>
                        <input
                            id="community-name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-slug" className="type-body-sm text-(--primary)">
                            Slug
                        </label>
                        <input
                            id="community-slug"
                            type="text"
                            value={community.slug}
                            disabled
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-secondary outline-none disabled:opacity-70"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-category" className="type-body-sm text-(--primary)">
                            Category
                        </label>
                        <input
                            id="community-category"
                            name="category"
                            type="text"
                            value={formData.category}
                            onChange={handleChange}
                            className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="community-visibility" className="type-body-sm cursor-pointer text-(--primary)">
                            Visibility
                        </label>
                        <ThemedDropdownSelect
                            id="community-visibility"
                            value={formData.visibility}
                            options={visibilityOptions}
                            ariaLabel="Select community visibility"
                            onChange={(visibility) =>
                                setFormData((currentData) => ({
                                    ...currentData,
                                    visibility,
                                }))
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label htmlFor="community-description" className="type-body-sm text-(--primary)">
                            Description
                        </label>
                        <textarea
                            id="community-description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="input-surface type-body-sm w-full resize-none rounded-lg px-4 py-3 text-primary outline-none"
                        />
                    </div>
                </div>

                <button type="submit" className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3">
                    <Save size={18} />
                    Save Changes
                </button>
            </form>
        </section>
    );
}
